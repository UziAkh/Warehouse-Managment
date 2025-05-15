# Warehouse-Managment
3PL Project
Best practices for future changes

Start fresh when working on new features
git checkout main
git pull
git checkout -b feature/new-feature-name
This creates a new branch based on the latest main
Commit frequently with clear messages
git add .
git commit -m "Descriptive message about what changed"

Push regularly to back up your work
git push origin feature/new-feature-name

Create pull requests to merge changes
This allows for code review and maintains a clear history
Keep your local main up to date
git checkout main
git pull
