# Mobile Studio Code

A mobile IDE built with Expo and React Native — write, edit, and ship code from your iOS device.

---

## Status

[![Expo Preview](https://img.shields.io/github/actions/workflow/status/kevinthelago/Mobile-Studio-Code/expo-preview.yml?label=Expo%20Preview&logo=expo&logoColor=white)](https://github.com/kevinthelago/Mobile-Studio-Code/actions/workflows/expo-preview.yml)
[![Issue Branch Check](https://img.shields.io/github/actions/workflow/status/kevinthelago/Mobile-Studio-Code/issue-branch-check.yml?label=Issue%20Check&logo=github)](https://github.com/kevinthelago/Mobile-Studio-Code/actions/workflows/issue-branch-check.yml)
[![EAS Update](https://img.shields.io/github/actions/workflow/status/kevinthelago/Mobile-Studio-Code/update.yml?label=EAS%20Update&logo=expo&logoColor=white)](https://github.com/kevinthelago/Mobile-Studio-Code/actions/workflows/update.yml)
[![GitHub Issues](https://img.shields.io/github/issues/kevinthelago/Mobile-Studio-Code?logo=github)](https://github.com/kevinthelago/Mobile-Studio-Code/issues)
[![GitHub PRs](https://img.shields.io/github/issues-pr/kevinthelago/Mobile-Studio-Code?logo=github)](https://github.com/kevinthelago/Mobile-Studio-Code/pulls)

---

## 📱 Open in Expo Go

Scan or tap the link below to open the latest published update directly in **Expo Go**:

**[▶️ Open in Expo Go → expo.dev/@kevinthelago/mobile-studio-code](https://expo.dev/@kevinthelago/mobile-studio-code)**

> Requires the [Expo Go](https://expo.dev/client) app on your iOS device.  
> Updates publish automatically on every push to `main`.

---

## 📦 Latest Preview Build

> Preview bundles are built automatically on every PR to `main`.  
> Find the latest artifact on the Actions page:

**[⬇️ Download Latest Preview Bundle →](https://github.com/kevinthelago/Mobile-Studio-Code/actions/workflows/expo-preview.yml)**

1. Open the latest successful run
2. Scroll to **Artifacts** → download `expo-preview-pr-N`
3. Unzip and serve: `npx serve dist/`
4. Open Expo Go → enter the local URL

---

## 🗂️ Task & Branch Workflow

Every change is tracked through a GitHub Issue.

```
Open Issue  →  Create Branch  →  Open PR  →  Merge  →  Issue Closes
```

| Step | Convention |
|------|-----------|
| New task | Open a GitHub Issue (use a template below) |
| Start work | Create branch `issue-{number}/short-slug` |
| Open PR | Fill in PR template — include `Closes #N` |
| Merge | Issue auto-closes, artifact is uploaded |

### Issue Templates
- [✨ Feature](https://github.com/kevinthelago/Mobile-Studio-Code/issues/new?template=feature.md)
- [🐛 Bug](https://github.com/kevinthelago/Mobile-Studio-Code/issues/new?template=bug.md)
- [🔧 Chore](https://github.com/kevinthelago/Mobile-Studio-Code/issues/new?template=chore.md)

---

## Getting Started

```bash
npm install
npx expo start
```

Requires [Expo Go](https://expo.dev/client) on your iOS device.

---

## Tech Stack

| | |
|---|---|
| Framework | Expo SDK 54 / React Native 0.81 |
| Router | expo-router |
| AI | Anthropic Claude (`@anthropic-ai/sdk`) |
| Language | TypeScript |
