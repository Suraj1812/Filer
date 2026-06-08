import { Box } from "@mui/material";

type FilerLogoProps = {
  size?: number;
};

export function FilerLogo({ size = 48 }: FilerLogoProps) {
  return (
    <Box
      aria-hidden="true"
      component="svg"
      focusable="false"
      height={size}
      role="img"
      viewBox="0 0 64 64"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect fill="#256f73" height="64" rx="14" width="64" />
      <path
        d="M14 22.5C14 18.9 16.9 16 20.5 16h13.1c1.7 0 3.4.7 4.6 1.9l3.9 3.9c1.2 1.2 2.9 1.9 4.6 1.9h.8c3.6 0 6.5 2.9 6.5 6.5v15.3c0 3.6-2.9 6.5-6.5 6.5h-27C16.9 52 14 49.1 14 45.5v-23Z"
        fill="#ffffff"
      />
      <path
        d="M14 28h40v17.5c0 3.6-2.9 6.5-6.5 6.5h-27C16.9 52 14 49.1 14 45.5V28Z"
        fill="#eaf4f2"
      />
      <path
        d="M28.5 37.5h7M28.5 43h12"
        stroke="#256f73"
        strokeLinecap="round"
        strokeWidth="4"
      />
      <circle cx="22" cy="37.5" fill="#c56f1a" r="3" />
      <circle cx="22" cy="43" fill="#256f73" r="3" />
    </Box>
  );
}
