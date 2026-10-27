import importlib.util
import os
from pathlib import Path
import unittest
from unittest.mock import patch, MagicMock
from types import SimpleNamespace
from pydantic import SecretStr
from app.core.config import settings
from app.services.model_provider import generate_huggingface, generate_model_answer, ModelAnswer, ModelUnavailable


class OllamaProviderTests(unittest.TestCase):
    def setUp(self):
        self.enterContext(patch.object(settings, 'LLM_PROVIDER', 'ollama'))
        self.enterContext(patch.object(settings, 'OLLAMA_MODEL', 'llama3.1:8b'))
        self.enterContext(patch.object(settings, 'LLM_TIMEOUT_SECONDS', 180))
        self.enterContext(patch.object(settings, 'OLLAMA_MAX_OUTPUT_TOKENS', 384))

    def test_local_limits_timeout_and_provenance(self):
        client = MagicMock()
        client.chat.return_value = SimpleNamespace(message=SimpleNamespace(content='Synthetic generated answer'), done_reason='stop')
        with patch('ollama.Client', return_value=client) as constructor, patch('app.services.model_provider.generate_huggingface') as cloud:
            answer = generate_model_answer('Synthetic prompt')
        self.assertEqual(answer.provider, 'ollama')
        self.assertEqual(answer.model, 'llama3.1:8b')
        self.assertEqual(answer.notice, '')
        self.assertEqual(constructor.call_args.kwargs['timeout'], 180)
        self.assertEqual(client.chat.call_args.kwargs['options']['num_predict'], 384)
        cloud.assert_not_called()

    def test_output_limit_is_disclosed(self):
        client = MagicMock()
        client.chat.return_value = SimpleNamespace(message=SimpleNamespace(content='Partial generated answer'), done_reason='length')
        with patch('ollama.Client', return_value=client):
            answer = generate_model_answer('Synthetic prompt')
        self.assertIn('token limit', answer.notice)

    def test_missing_model_has_specific_safe_error(self):
        from ollama import ResponseError
        client = MagicMock()
        client.chat.side_effect = ResponseError('secret prompt not found', status_code=404)
        with patch('ollama.Client', return_value=client):
            with self.assertRaisesRegex(ModelUnavailable, '^Configured Ollama model is not installed$'):
                generate_model_answer('Synthetic prompt')

    def test_timeout_reports_effective_setting(self):
        from httpx import ReadTimeout
        client = MagicMock()
        client.chat.side_effect = ReadTimeout('secret prompt')
        with patch('ollama.Client', return_value=client):
            with self.assertRaisesRegex(ModelUnavailable, '^Local Ollama timed out after 180 seconds$'):
                generate_model_answer('Synthetic prompt')


class ModelProviderTests(unittest.TestCase):
    def setUp(self):
        self.patches = [patch.object(settings, 'HF_TOKEN', SecretStr('fake-token')), patch.object(settings, 'FINCREDIT_SPACE_KEY', SecretStr('k'*32)), patch.object(settings, 'LLM_PROVIDER', 'huggingface'), patch.object(settings, 'HF_ALLOW_OLLAMA_FALLBACK', False)]
        for p in self.patches:
            p.start()
            self.addCleanup(p.stop)

    def client(self, result):
        client = MagicMock()
        client.submit.return_value.result.return_value = result
        return client

    def test_success_uses_space_and_preserves_provider(self):
        client = self.client({'ok': True, 'text': 'Grounded answer', 'generationSeconds': 1.2})
        with patch('gradio_client.Client', return_value=client) as constructor:
            answer = generate_model_answer('Synthetic research question')
        self.assertEqual(answer.provider, 'huggingface')
        self.assertEqual(str(answer), 'Grounded answer')
        self.assertEqual(constructor.call_args.args, ('Sreemaan05/fincredit-ai-inference',))
        client.submit.assert_called_once_with('Synthetic research question', 'k'*32, api_name='/generate')
        client.close.assert_called_once()

    def test_quota_does_not_automatically_use_local_or_retry(self):
        client = self.client({'ok': False, 'error': 'quota_exhausted'})
        with patch('gradio_client.Client', return_value=client), patch('app.services.model_provider.generate_local') as local:
            with self.assertRaisesRegex(ModelUnavailable, 'quota exhausted'):
                generate_model_answer('test')
        local.assert_not_called()
        client.submit.assert_called_once()

    def test_optional_local_fallback_reports_it(self):
        with patch.object(settings, 'HF_ALLOW_OLLAMA_FALLBACK', True), patch('app.services.model_provider.generate_huggingface', side_effect=ModelUnavailable('quota')), patch('app.services.model_provider.generate_local', return_value=ModelAnswer('Local answer','ollama','small')):
            result = generate_model_answer('test')
        self.assertEqual(result.provider, 'ollama')
        self.assertIn('Cloud unavailable', result.notice)

    def test_provider_errors_never_expose_secret(self):
        with patch('gradio_client.Client', side_effect=RuntimeError('fake-token secret prompt')):
            with self.assertRaises(ModelUnavailable) as caught:
                generate_huggingface('test')
        self.assertNotIn('fake-token', str(caught.exception))
        self.assertNotIn('secret prompt', str(caught.exception))

    def test_timeout_cancels_job(self):
        client = self.client(None)
        client.submit.return_value.result.side_effect = TimeoutError()
        with patch('gradio_client.Client', return_value=client):
            with self.assertRaisesRegex(ModelUnavailable, 'timed out'):
                generate_huggingface('test')
        client.submit.return_value.cancel.assert_called_once()

    def test_empty_response_and_bad_credentials_fail(self):
        with patch('gradio_client.Client', return_value=self.client({'ok': True, 'text': ''})):
            with self.assertRaisesRegex(ModelUnavailable, 'invalid answer'):
                generate_huggingface('test')
        with patch.object(settings, 'HF_TOKEN', SecretStr('')), patch('gradio_client.Client') as constructor:
            with self.assertRaisesRegex(ModelUnavailable, 'not configured'):
                generate_huggingface('test')
        constructor.assert_not_called()

    def test_huge_prompt_does_not_reach_space(self):
        with patch('gradio_client.Client') as constructor:
            with self.assertRaisesRegex(ModelUnavailable, 'request limit'):
                generate_huggingface('x'*24001)
        constructor.assert_not_called()

    def test_cloud_label_reaches_audit(self):
        from test_research_agents import prepared_state
        from app.agents.fincredit_graph import answer_agent
        with patch('app.agents.fincredit_graph.generate_llm_answer', return_value=ModelAnswer('Research answer', 'huggingface', 'Qwen')):
            result = answer_agent(prepared_state())
        self.assertIn('huggingface: Qwen', result['audit']['status'])


class SpacePolicyTests(unittest.TestCase):
    def test_fails_closed_and_enforces_limits_before_gpu(self):
        path = Path(__file__).resolve().parents[2] / 'deployment/huggingface-space/policy.py'
        spec = importlib.util.spec_from_file_location('space_policy', path)
        policy = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(policy)
        with patch.dict(os.environ, {}, clear=True):
            self.assertEqual(policy.validate_request('test',''), 'not_configured')
        with patch.dict(os.environ, {'FINCREDIT_SPACE_KEY': 'k'*32}):
            self.assertEqual(policy.validate_request('test','wrong'), 'unauthorized')
            self.assertEqual(policy.validate_request('x'*24001,'k'*32), 'invalid_prompt')
            self.assertIsNone(policy.validate_request('test','k'*32))
