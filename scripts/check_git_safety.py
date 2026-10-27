"""Read-only pre-staging audit. Reports paths/line numbers, never secret values.

Scans modified tracked + unignored untracked files without changing the index.
Also compares candidates with sensitive values from ignored local .env files.
Heuristics supplement manual review; they cannot certify absence of all secrets.
"""
from pathlib import Path
import json
import os
import re
import subprocess

ROOT = Path(__file__).resolve().parents[1]


def git(*args):
    return subprocess.check_output(["git", *args], cwd=ROOT).decode().split("\0")


def sensitive_path(path):
    p = Path(path)
    name = p.name.lower()
    return (
        (name.startswith(".env") and not name.endswith(".example"))
        or bool(re.search(r"(?:credentials|secrets?)\.(?:json|ya?ml|toml|txt)$", name))
        or name.startswith(("id_rsa", "id_ed25519"))
        or name in {".netrc", ".pypirc"}
        or (name.endswith(".json") and ("credentials" in name or name.startswith(("service-account", "token"))))
        or name.startswith("passwords")
        or any(part in {".secrets", ".ollama", ".aws", ".ssh"} for part in p.parts)
        or bool(re.search(r"\.(?:pem|key|p12|pfx|token|gguf|safetensors|pt|pth|onnx|bin|db|sqlite3?|sql|dump|backup)(?:-.*)?$", name))
    )


def main():
    candidates = sorted(set(filter(None, git("diff", "--name-only", "HEAD", "-z")
                                   + git("ls-files", "--others", "--exclude-standard", "-z"))))
    tracked = set(filter(None, git("ls-files", "-z")))
    findings = []
    credentials = []
    local_values = set()
    for parent, dirs, names in os.walk(ROOT):
        dirs[:] = [d for d in dirs if d not in {
            ".git", ".venv", "venv", "node_modules", ".next", "__pycache__",
            "playwright-report", "test-results",
        }]
        for name in names:
            p = Path(parent) / name
            relative = p.relative_to(ROOT).as_posix()
            if not sensitive_path(relative):
                continue
            ignored = subprocess.run(["git", "check-ignore", "-q", "--", relative], cwd=ROOT).returncode == 0
            credentials.append({"path": relative, "ignored": ignored, "tracked": relative in tracked})
            if not ignored or relative in tracked:
                findings.append({"path": relative, "kind": "sensitive file must be ignored and untracked"})
            if name.startswith(".env"):
                for line in p.read_text(encoding="utf-8").splitlines():
                    key, sep, value = line.partition("=")
                    if sep and re.search(r"TOKEN|PASSWORD|SECRET|SPACE_KEY|API_KEY", key, re.I):
                        value = value.strip().strip("\"'")
                        if len(value) >= 8:
                            local_values.add(value)
    patterns = {
        "provider token": r"(?:hf_[A-Za-z0-9]{20,}|gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|sk-[A-Za-z0-9_-]{20,}|AKIA[A-Z0-9]{16})",
        "private key": r"-----BEGIN (?:[A-Z ]+)?PRIVATE KEY-----",
        "JWT": r"eyJ[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{12,}",
    }
    for name in candidates:
        p = ROOT / name
        if not p.is_file():
            continue
        if sensitive_path(name):
            findings.append({"path": name, "kind": "prohibited staging candidate"})
        try:
            content = p.read_text(encoding="utf-8")
        except UnicodeError:
            findings.append({"path": name, "kind": "binary requires manual review"})
            continue
        for number, line in enumerate(content.splitlines(), 1):
            for kind, pattern in patterns.items():
                if re.search(pattern, line):
                    findings.append({"path": name, "line": number, "kind": kind})
            if any(value in line for value in local_values):
                findings.append({"path": name, "line": number, "kind": "matches private environment value"})
    print(json.dumps({"credential_files": credentials, "findings": findings,
                      "intended_files": candidates, "count": len(candidates)}, indent=2))
    return 1 if findings else 0


if __name__ == "__main__":
    raise SystemExit(main())
