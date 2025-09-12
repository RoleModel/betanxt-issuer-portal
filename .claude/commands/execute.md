Plan how to implement the specified figma design.

Given the Figma link provided as an argument, do this:

1. Take the provided url and use FigmaMCP to extract any components
2. Read and analyze the file to understand:

   - MUI Components
   - Layout and Varaibles
   - Use Mui MCP to understand Mui Implementation details and best practices
   - consult the @rolemodel/betanxt-design-system for existing theme/component configuration.
   - Realize the theme is built with CSSVAriables enabled and it built to support MUI 7.3.1 with colorSchemes
   - Very little customization should be needed however you should

An example component...

```
const StyledTableSkeleton = styled(TableSkeleton)(({ theme }) => ({
  paddingTop: theme.spacing(0),
  paddingBottom: theme.spacing(0),
  paddingLeft: theme.spacing(2),
  paddingRight: theme.spacing(2),
  background: theme.vars.palette.background.default
}))

function ChartLegendTableSkeleton() {
  return <StyledTableSkeleton columns={2} />
}
```

3. describe the layout in `spec/screen-details.md`

4. Read the constitution at `/memory/constitution.md` to understand constitutional requirements.

5. Execute the screen and create new components in `/isser-portal/components/{screen-name}/`

6. Verify execution completed:

   - Check Progress Tracking shows all phases complete
   - Ensure all required screens and components are generated
   - Confirm no ERROR states in execution

7. Report results with branch name, file paths, and generated artifacts.

Use absolute paths with the repository root for all file operations to avoid path issues.
