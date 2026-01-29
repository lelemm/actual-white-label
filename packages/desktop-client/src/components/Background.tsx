import React from 'react';
import { theme } from '@actual-app/components/theme';

export function Background() {
  const stroke = theme.pageTextSubdued ?? 'rgba(255,255,255,0.22)';

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        backgroundColor: theme.pageBackground,
        overflow: 'hidden',
      }}
    >
      <svg
        viewBox="0 0 642 535"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
        }}
      >
        {/* Background gradient */}
        <path fill="url(#paint0_linear)" d="M0 0h642v535H0z" />

        {/* Slight vignette (optional, helps readability) */}
        <rect
          x="0"
          y="0"
          width="642"
          height="535"
          fill="url(#vignette)"
          opacity="0.65"
        />

        {/* Geometric strokes */}
        <g
          opacity="0.35"
          stroke={stroke}
          strokeWidth="1.2"
          vectorEffect="non-scaling-stroke"
        >
          {/* Helper to reuse a style */}
          <g strokeLinecap="round" strokeLinejoin="round">
            {/* Big rotating squares/rectangles */}
            <g transform="translate(110 110)">
              <rect x="-55" y="-55" width="110" height="110" rx="10" />
              <animateTransform
                attributeName="transform"
                type="rotate"
                additive="sum"
                from="0"
                to="360"
                dur="48s"
                repeatCount="indefinite"
              />
              <animateTransform
                attributeName="transform"
                type="translate"
                additive="sum"
                values="0 0; 20 -10; 0 0"
                dur="18s"
                repeatCount="indefinite"
              />
            </g>

            <g transform="translate(520 160)">
              <rect x="-80" y="-50" width="160" height="100" rx="14" />
              <rect x="-55" y="-25" width="110" height="50" rx="10" opacity="0.6" />
              <animateTransform
                attributeName="transform"
                type="rotate"
                additive="sum"
                from="360"
                to="0"
                dur="60s"
                repeatCount="indefinite"
              />
              <animateTransform
                attributeName="transform"
                type="translate"
                additive="sum"
                values="0 0; -22 14; 0 0"
                dur="22s"
                repeatCount="indefinite"
              />
            </g>

            {/* Rings */}
            <g transform="translate(470 380)">
              <circle r="72" />
              <circle r="48" opacity="0.55" />
              <circle r="24" opacity="0.35" />
              <animateTransform
                attributeName="transform"
                type="rotate"
                additive="sum"
                from="0"
                to="360"
                dur="72s"
                repeatCount="indefinite"
              />
              <animateTransform
                attributeName="transform"
                type="translate"
                additive="sum"
                values="0 0; 12 18; 0 0"
                dur="26s"
                repeatCount="indefinite"
              />
            </g>

            {/* Hexagon + triangle cluster */}
            <g transform="translate(170 390)">
              <polygon points="0,-50 43,-25 43,25 0,50 -43,25 -43,-25" />
              <polygon points="0,-28 24,14 -24,14" opacity="0.6" />
              <animateTransform
                attributeName="transform"
                type="rotate"
                additive="sum"
                from="0"
                to="-360"
                dur="64s"
                repeatCount="indefinite"
              />
              <animateTransform
                attributeName="transform"
                type="translate"
                additive="sum"
                values="0 0; -16 10; 0 0"
                dur="20s"
                repeatCount="indefinite"
              />
            </g>

            {/* Thin “HUD” lines */}
            <g transform="translate(320 140)" opacity="0.55">
              <path d="M-90 0H90" />
              <path d="M-60 -18H60" opacity="0.7" />
              <path d="M-60 18H60" opacity="0.7" />
              <circle cx="-92" cy="0" r="3" />
              <circle cx="92" cy="0" r="3" />
              <animateTransform
                attributeName="transform"
                type="translate"
                values="0 0; 0 -16; 0 0"
                dur="16s"
                repeatCount="indefinite"
              />
            </g>

            {/* Small scattered shapes */}
            <g transform="translate(80 260)" opacity="0.5">
              <circle r="16" />
              <rect x="-10" y="-28" width="20" height="20" rx="4" opacity="0.7" />
              <animateTransform
                attributeName="transform"
                type="rotate"
                from="0"
                to="360"
                dur="34s"
                repeatCount="indefinite"
              />
            </g>

            <g transform="translate(585 470)" opacity="0.45">
              <polygon points="0,-18 16,6 -16,6" />
              <circle cx="28" cy="0" r="10" opacity="0.65" />
              <animateTransform
                attributeName="transform"
                type="rotate"
                from="360"
                to="0"
                dur="40s"
                repeatCount="indefinite"
              />
              <animateTransform
                attributeName="transform"
                type="translate"
                additive="sum"
                values="0 0; -12 -10; 0 0"
                dur="18s"
                repeatCount="indefinite"
              />
            </g>
          </g>
        </g>

        {/* defs */}
        <defs>
          <linearGradient
            id="paint0_linear"
            x1="162"
            y1="23.261"
            x2="468.904"
            y2="520.44"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor={theme.pageBackgroundTopLeft} />
            <stop
              offset="1"
              stopColor={theme.pageBackgroundBottomRight}
              stopOpacity="0.5"
            />
          </linearGradient>

          {/* vignette: darker edges, clearer center */}
          <radialGradient id="vignette" cx="50%" cy="42%" r="75%">
            <stop offset="0%" stopColor="#000" stopOpacity="0.0" />
            <stop offset="100%" stopColor="#000" stopOpacity="0.55" />
          </radialGradient>
        </defs>
      </svg>
    </div>
  );
}
