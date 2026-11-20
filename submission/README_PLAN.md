# Root README Update Plan

## Goal

Make the GitHub landing page useful to a farmer, evaluator, app user, or developer without requiring knowledge of the backend. Keep detailed operational notes in linked documentation.

## Structure

1. Plain-language purpose and Team PentaFarmers credit.
2. Prominent web, Android download, mobile source, and demo links.
3. Android installation guidance, release alternatives, and source/release distinction.
4. Short feature table with honest limitations and data-source behavior.
5. Simple explanation of web, mobile REST API, and local development paths.
6. Repository map and frontend-first setup, including current Firebase requirements.
7. Links to backend/API, deployment, model, and MCP documentation.
8. Existing application/model licensing distinction.

## Verified Mobile Links

- Source: https://github.com/ausabbir76/Krsishi-Bondhu-AI-App
- Latest release: https://github.com/ausabbir76/Krsishi-Bondhu-AI-App/releases/latest
- Release V1: https://github.com/ausabbir76/Krsishi-Bondhu-AI-App/releases/tag/V1
- ARM64 APK: https://github.com/ausabbir76/Krsishi-Bondhu-AI-App/releases/download/V1/Krishi-Bondhu-AI-arm64-v8a.apk
- x86 APK: available on the release page; avoid presenting it as a universal phone build.

GitHub's public release-assets page lists both APKs. Current main has changes after V1, so current source documentation does not prove feature parity in the APK. GitHub CLI is unavailable and the public REST API returned 403; public HTML and raw source were used instead.

## Verification

- Inspect the final README diff for unsupported claims and unnecessary detail.
- Check every local Markdown link exists.
- Verify external entry points and the APK download response without downloading the entire binary.
- Check whitespace and Markdown structure. No application build is required for this documentation-only change.

Scope: root README and this plan only. The user subsequently authorized committing and pushing this documentation update; application changes and release publication remain outside this commit.

## Results

- Root README reduced from 203 to 130 lines, with product/download guidance first and developer details below.
- Mobile repository, latest-release page and ARM64 APK returned HTTP 200. The APK response declared application/vnd.android.package-archive and 26,276,503 bytes; the binary was not installed or functionally tested.
- All 13 local README link targets exist. Both Hugging Face service pages responded. The existing Vercel URL could not be verified because requests timed out or returned a transport error from this environment.
- git diff --check passed for README.md, with a CRLF conversion warning only. Application tests/build were not run for this documentation-only change.
