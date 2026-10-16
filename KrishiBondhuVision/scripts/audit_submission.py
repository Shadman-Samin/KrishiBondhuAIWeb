"""Pre-submit audit: char floors for scored notes + artifact presence.
Run: .venv\\Scripts\\python.exe scripts\\audit_submission.py  (exit 0 = pass)
"""
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
REPO = ROOT.parent
DOCS = REPO / "docs"

CHECKS = []  # (label, ok, detail)


def check(label, ok, detail=""):
    CHECKS.append((label, bool(ok), detail))


def section(path, header):
    try:
        text = (DOCS / path).read_text(encoding="utf-8")
    except FileNotFoundError:
        return ""
    idx = text.find(header)
    if idx < 0:
        return ""
    nxt = text.find("\n## ", idx + 1)
    return text[idx:nxt if nxt > 0 else len(text)]


def main():
    notes = [
        ("Token Optimization", "## 2. Token Optimization Notes", 50),
        ("AI-DLC", "## 3. AI-DLC Process Notes", 100),
        ("Agent/Orchestration", "## 4. Agent / Orchestration Notes", 80),
        ("Fine-Tuning", "## 5. Fine-Tuning / Adaptation Notes", 80),
        ("Evaluation", "## 6. Evaluation & Quality Methods", 80),
        ("Guardrails", "## 7. Guardrails / Safety / Privacy", 80),
        ("Tunneling", "## 8. Tunneling Usage Notes", 80),
        ("Data Quality", "## 9. Data Quality Measures", 80),
        ("Privacy", "## 10. Privacy & Compliance Notes", 80),
        ("Lineage", "## 11. Lineage & Observability Notes", 80),
    ]
    for label, header, floor in notes:
        body = section("SUBMISSION_NOTES.md", header)
        check(f"{label} >= {floor} chars", len(body) >= floor, f"{len(body)} chars")

    prompt = section("SUBMISSION_NOTES.md", "## 1. Prompt Strategy Text")
    check("Prompt Strategy present", len(prompt) >= 200, f"{len(prompt)} chars")

    for f in ["MASTER_PROMPT.md", "SUBMISSION_NOTES.md", "ACCESS_NOTE.md",
              "PITCH_OUTLINE.md", "YOUTUBE_SCRIPT.md", "FIGMA_PLAN.md", "DEPLOY.md"]:
        check(f"docs/{f}", (DOCS / f).exists())
    for f in ["mcp-server/server.py", "mcp-server/MCP.md",
              "KrishiBondhuVision/api/rag/store.py",
              "KrishiBondhuVision/api/agent/loop.py",
              "KrishiBondhuVision/api/admin.py",
              "KrishiBondhuVision/MODELS.md",
              "KrishiBondhuVision/Dockerfile",
              "KrishiBondhuWeb/vercel.json",
              "docs/n8n-dam-scrape.json"]:
        check(f"artifact {f}", (REPO / f).exists())

    # Master prompt 8-module completeness
    try:
        mp = (DOCS / "MASTER_PROMPT.md").read_text(encoding="utf-8")
        for i in range(1, 9):
            check(f"master-prompt module {i}", f"**{i}." in mp)
    except FileNotFoundError:
        check("MASTER_PROMPT.md readable", False)

    failed = [c for c in CHECKS if not c[1]]
    for label, ok, detail in CHECKS:
        print(f"[{'PASS' if ok else 'FAIL'}] {label} {detail}")
    print(f"\n{len(CHECKS) - len(failed)}/{len(CHECKS)} passed")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
