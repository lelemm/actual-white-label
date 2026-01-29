import * as React from 'react';
import type { SVGProps } from 'react';
export const SvgLogo = (props: SVGProps<SVGSVGElement>) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 30 32"
    style={{
      color: 'inherit',
      ...props.style,
    }}
  >
    <path fill="currentColor" d="M3.56 2.91 L6.44 2.09 L11.44 19.59 L8.56 20.41 Z" />
    <path fill="currentColor" d="M8.6 19.47 L11.4 20.53 L15.9 8.53 L13.1 7.47 Z" />
    <path fill="currentColor" d="M14.1 8.53 L16.9 7.47 L21.4 19.47 L18.6 20.53 Z" />
    <path fill="currentColor" d="M18.56 20.41 L21.44 19.59 L26.44 2.91 L23.56 2.09 Z" />
  </svg>
);
