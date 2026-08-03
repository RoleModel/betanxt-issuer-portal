import "react";

declare module "react" {
  export const ViewTransition: ComponentType<{
    children?: ReactNode;
    name?: string;
  }>;
}
