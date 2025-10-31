# Handling Merge Conflicts

When GitHub Desktop or Git prompts you with a merge conflict and offers the options **"Accept Current Change"** and **"Accept Incoming Change"**, here is what each choice means:

- **Accept Current Change** keeps the version that already exists in your local branch (what you had before pulling or merging).
- **Accept Incoming Change** uses the version coming from the branch you are merging (for example, the latest code from `master`).
- You can also choose **Accept Both Changes** if you want to keep both sections and resolve the differences manually.

If you want your local branch to match what is on `master`, accept the **incoming change** whenever you are prompted. After resolving all conflicts, run:

```bash
git add <file>
git commit
```

Then continue the merge or rebase as instructed by Git.

## Getting a Fresh Pull Request

The repository history already contains the latest dashboard and active-loan changes. If you need a clean pull request against `master`, you can:

1. Ensure your local checkout is clean and up-to-date:
   ```bash
   git checkout master
   git pull origin master
   ```
2. Create a new branch from `master`:
   ```bash
   git checkout -b feature/dashboard-refresh
   ```
3. Cherry-pick the commits you want to include or copy the files from the desired commit.
4. Push the branch and open a pull request on GitHub targeting `master`.

This will give you a fresh PR that contains the consolidated changes so you can pull them locally.
