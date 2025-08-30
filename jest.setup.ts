// Add jest-dom's custom assertions
import '@testing-library/jest-dom';
import React from 'react';

// Mock next/router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '',
      query: {},
      asPath: '',
      push: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
      },
      beforePopState: jest.fn(() => null),
      prefetch: jest.fn(() => Promise.resolve()),
    };
  },
}));

// Mock next/head
jest.mock('next/head', () => {
  return {
    __esModule: true,
    default: function Head({ children }: { children: Array<React.ReactElement> }) {
      return React.createElement(React.Fragment, null, children);
    },
  };
});

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return React.createElement('a', { href }, children);
  };
});

// Mock next/image
jest.mock('next/image', () => {
  return function Image({ src, alt, ...props }: any) {
    // eslint-disable-next-line @next/next/no-img-element
    return React.createElement('img', { src, alt, ...props });
  };
});
