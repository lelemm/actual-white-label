// @ts-strict-ignore
import { type CSSProperties } from 'react';

import { styles } from '@actual-app/components/styles';
import { theme } from '@actual-app/components/theme';

// Style for secondary menu items (originally used for account names)
// This ensures consistent styling with the original Actual White Label design
export const accountNameStyle: CSSProperties = {
  marginTop: -2,
  marginBottom: 2,
  paddingTop: 4,
  paddingBottom: 4,
  paddingRight: 15,
  paddingLeft: 10,
  textDecoration: 'none',
  color: theme.sidebarItemText,
  ':hover': { backgroundColor: theme.sidebarItemBackgroundHover },
  ...styles.smallText,
};
