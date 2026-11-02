#!/usr/bin/env python3
"""Regression check for YourHRCoach toolkit positioning. Run from repo root: python3 scripts/check_positioning.py"""
import json,re,sys,pathlib
R=pathlib.Path(__file__).resolve().parent.parent; fails=[]
def ld(f):
    return [json.loads(b) for b in re.findall(r'<script type="application/ld\+json">(.*?)</script>',(R/f).read_text(),re.S)]
for f in ["index.html","pricing.html","for-hr-consultants.html"]:
    try: ld(f)
    except Exception as e: fails.append(f"{f}: invalid JSON-LD {e}")
apps=[n for g in ld("index.html") for n in g.get("@graph",[g]) if n.get("@type")=="SoftwareApplication"]
fl=" | ".join(apps[0].get("featureList",[])) if apps else ""
for need in ["HR answers","document generation","upload and review","Case Tracker","8 guided HR templates","official-source law checks","law update","Client workspaces","Saved conversation history"]:
    if need.lower() not in fl.lower(): fails.append(f"featureList missing: {need}")
files=[p for p in R.rglob("*") if p.suffix in(".html",".txt",".md") and ".git" not in p.parts and "node_modules" not in p.parts]
for p in files:
    t=p.read_text(errors="ignore")
    for pat in [r"(conversation|chat|history|saved)[^.<]{0,60}searchable",r"search (your|past|all) (conversations|chats|history)",r"conversation search",r"\bfull HRIS\b",r"payroll (processing|administration) (included|built)",r"guaranteed savings"]:
        for m in re.finditer(pat,t,re.I): fails.append(f"{p.relative_to(R)}: banned claim '{m.group(0)}'")
idx=(R/"index.html").read_text()
for need in ["Handle HR Questions, Documents, and Employee Issues","AI-Powered HR Toolkit for Small Businesses","Your conversation history is saved"]:
    if need not in idx: fails.append(f"index.html missing: {need}")
if "AI-powered HR toolkit" not in (R/"llms.txt").read_text(errors="ignore") and "HR Toolkit" not in (R/"llms.txt").read_text(): fails.append("llms.txt missing toolkit positioning")
print("\n".join(fails) or "OK: positioning checks passed"); sys.exit(1 if fails else 0)
