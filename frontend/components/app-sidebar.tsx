"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, BriefcaseBusiness, Activity, MessageSquareText, Users, FileText, ShieldCheck, Settings, UserCircle, Shield, Menu } from "lucide-react";
import { getStoredUser } from "@/lib/api";
const groups = [
  {label: "WORKSPACE", items: [{label:"Overview",href:"/dashboard",icon:Home},{label:"Stock research",href:"/stock/AMZN",icon:Search},{label:"Portfolio",href:"/portfolio",icon:BriefcaseBusiness},{label:"Watchlist",href:"/watchlist",icon:Activity}]},
  {label: "INTELLIGENCE", items: [{label:"Committee",href:"/committee",icon:Users},{label:"Ask FinCredit",href:"/ask",icon:MessageSquareText},{label:"Reports",href:"/reports",icon:FileText},{label:"Governance",href:"/governance",icon:ShieldCheck}]},
  {label: "ACCOUNT", items: [{label:"Profile",href:"/profile",icon:UserCircle},{label:"Settings",href:"/settings",icon:Settings}]},
];
export function AppSidebar() {
  const pathname = usePathname();
  const [admin,setAdmin] = useState(false);
  const [open,setOpen] = useState(false);
  useEffect(() => {setAdmin(getStoredUser()?.role === "admin");}, []);
  const links = <>{groups.map(group => <div key={group.label} className="mb-6"><p className="px-3 mb-2 text-[10px] tracking-widest text-slate-500">{group.label}</p>{group.items.map(item => {const selected = item.href.startsWith("/stock") ? pathname.startsWith("/stock") : pathname === item.href || pathname.startsWith(item.href + "/");return <Link key={item.href} href={item.href} onClick={() => setOpen(false)} aria-current={selected ? "page" : undefined} className={`flex gap-3 items-center px-3 py-2.5 rounded-md my-1 text-[13px] transition-colors ${selected ? "bg-[#233047] text-[#cdddff]" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}><item.icon size={17}/>{item.label}</Link>;})}</div>)}{admin && <Link href="/admin" onClick={() => setOpen(false)} className="flex items-center gap-3 px-3 py-2 text-sm text-slate-400"><Shield size={17}/>Admin console</Link>}</>;
  return <><aside className="hidden lg:block w-60 shrink-0 border-r border-[#263142] bg-[#0c121d] p-4"><Link href="/dashboard" className="block px-3 py-5 mb-6"><p className="font-semibold tracking-tight text-lg">FinCredit<span className="text-slate-500"> / AI</span></p><p className="text-[11px] text-slate-500 mt-1">Independent research workspace</p></Link><nav aria-label="Workspace navigation">{links}</nav><p className="border-t border-[#263142] pt-5 px-3 text-[11px] text-slate-500">Paper research. Human decisions.</p></aside><div className="lg:hidden fixed bottom-3 left-3 right-3 z-40"><div className="flex justify-between items-center bg-[#101722] border border-[#354259] rounded-lg p-3"><Link href="/dashboard" className="text-sm">FinCredit AI</Link><Link href="/committee" className="text-sm text-blue-200">Committee</Link><button onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="mobile-workspace-navigation" aria-label="Toggle navigation" className="p-2"><Menu size={20}/></button></div>{open && <nav id="mobile-workspace-navigation" aria-label="Mobile workspace navigation" className="absolute bottom-20 inset-x-0 max-h-[70vh] overflow-auto bg-[#101722] border border-[#354259] rounded-lg p-4 shadow-xl">{links}</nav>}</div></>;
}
