---
trigger: deploy
---
# Deploy Context Rules

- Only @devops (Gage) can trigger deployments and git push
- Verify all tests pass before requesting deployment: `npm test`
- Ensure story status is "Ready for Review" before deploy request
- Check environment variables are set correctly for target environment
- Monitor deployment logs for errors after each deploy
