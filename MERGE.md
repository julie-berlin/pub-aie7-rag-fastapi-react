# How to Merge `feat/frontend-components-refactor` to `main`

## 🚀 GitHub Pull Request (Recommended)
1. Push your branch to GitHub (if not already):
   ```sh
   git push origin feat/frontend-components-refactor
   ```
2. Go to your repository on GitHub.
3. Click "Compare & pull request" for `feat/frontend-components-refactor`.
4. Review the changes, add a description, and create the PR.
5. After review, click "Merge pull request".
6. (Optional) Delete the branch on GitHub after merging.

## 🛠️ GitHub CLI
1. Make sure you have the latest main:
   ```sh
   git checkout main
   git pull origin main
   ```
2. Merge the feature branch:
   ```sh
   git checkout feat/frontend-components-refactor
   git pull origin feat/frontend-components-refactor
   git checkout main
   git merge feat/frontend-components-refactor
   ```
3. Push the updated main branch:
   ```sh
   git push origin main
   ```
4. (Optional) Delete the feature branch:
   ```sh
   git branch -d feat/frontend-components-refactor
   git push origin --delete feat/frontend-components-refactor
   ```

---

**Pro tip:** Always review the PR in GitHub for CI results and code review before merging!