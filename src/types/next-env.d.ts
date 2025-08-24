/// <reference types="next" />
/// <reference types="next/types/global" />

declare namespace React {
  interface ReactElement {
    type: any;
    props: any;
    key: any;
  }
  
  type ReactNode = ReactElement | string | number | boolean | null | undefined;
}

declare namespace JSX {
  interface Element extends React.ReactElement {}
  interface IntrinsicElements {
    [elemName: string]: any;
  }
} 