// oxlint-disable-next-line eslint/no-restricted-imports
import * as colorPalette from '@desktop-client/style/palette';

// White-label light theme: mostly white with orange accents.
export const pageBackground = colorPalette.white;
export const pageBackgroundModalActive = colorPalette.gray80;
export const pageBackgroundTopLeft = colorPalette.white;
export const pageBackgroundBottomRight = colorPalette.orange100;
export const pageBackgroundLineTop = colorPalette.orange200;
export const pageBackgroundLineMid = colorPalette.gray80;
export const pageBackgroundLineBottom = colorPalette.orange100;
export const pageText = '#1b1b1f';
export const pageTextLight = colorPalette.gray500;
export const pageTextSubdued = colorPalette.gray400;
export const pageTextDark = '#0f0f12';
export const pageTextPositive = colorPalette.green700;
export const pageTextLink = colorPalette.orange700;
export const pageTextLinkLight = colorPalette.orange500;

export const cardBackground = colorPalette.white;
export const cardBorder = colorPalette.gray150;
export const cardShadow = 'rgba(0, 0, 0, 0.08)';

export const tableBackground = colorPalette.white;
export const tableRowBackgroundHover = colorPalette.orange50;
export const tableText = pageText;
export const tableTextLight = colorPalette.gray500;
export const tableTextSubdued = colorPalette.gray200;
export const tableTextSelected = pageTextDark;
export const tableTextHover = pageTextDark;
export const tableTextInactive = colorPalette.gray400;
export const tableHeaderText = colorPalette.gray500;
export const tableHeaderBackground = colorPalette.white;
export const tableBorder = colorPalette.gray150;
export const tableBorderSelected = colorPalette.orange500;
export const tableBorderHover = colorPalette.orange400;
export const tableBorderSeparator = colorPalette.gray200;
export const tableRowBackgroundHighlight = colorPalette.orange150;
export const tableRowBackgroundHighlightText = pageTextDark;
export const tableRowHeaderBackground = colorPalette.gray50;
export const tableRowHeaderText = pageTextDark;

export const numberPositive = colorPalette.green700;
export const numberNegative = colorPalette.red500;
export const numberNeutral = colorPalette.gray200;
export const budgetNumberNegative = numberNegative;
export const budgetNumberZero = tableTextSubdued;
export const budgetNumberNeutral = tableText;
export const budgetNumberPositive = budgetNumberNeutral;
export const templateNumberFunded = numberPositive;
export const templateNumberUnderFunded = colorPalette.orange700;
export const toBudgetPositive = numberPositive;
export const toBudgetZero = numberPositive;
export const toBudgetNegative = budgetNumberNegative;

export const sidebarBackground = colorPalette.white;
export const sidebarItemBackgroundPending = colorPalette.orange150;
export const sidebarItemBackgroundPositive = colorPalette.green500;
export const sidebarItemBackgroundFailed = colorPalette.red300;
export const sidebarItemBackgroundHover = colorPalette.gray80;
export const sidebarItemAccentSelected = colorPalette.orange500;
export const sidebarItemText = pageTextDark;
export const sidebarItemTextSelected = pageTextDark;
export const sidebarBudgetName = pageTextDark;

export const menuBackground = colorPalette.white;
export const menuItemBackground = colorPalette.gray50;
export const menuItemBackgroundHover = colorPalette.orange50;
export const menuItemText = pageTextDark;
export const menuItemTextHover = menuItemText;
export const menuItemTextSelected = colorPalette.orange700;
export const menuItemTextHeader = colorPalette.gray400;
export const menuBorder = colorPalette.gray150;
export const menuBorderHover = colorPalette.orange200;
export const menuKeybindingText = colorPalette.gray400;
export const menuAutoCompleteBackground = colorPalette.white;
export const menuAutoCompleteBackgroundHover = colorPalette.orange50;
export const menuAutoCompleteText = pageTextDark;
export const menuAutoCompleteTextHover = pageTextDark;
export const menuAutoCompleteTextHeader = colorPalette.orange150;
export const menuAutoCompleteItemTextHover = menuAutoCompleteText;
export const menuAutoCompleteItemText = menuAutoCompleteText;

export const modalBackground = colorPalette.white;
export const modalBorder = colorPalette.gray150;
export const mobileHeaderBackground = colorPalette.orange600;
export const mobileHeaderText = colorPalette.white;
export const mobileHeaderTextSubdued = colorPalette.gray200;
export const mobileHeaderTextHover = 'rgba(200, 200, 200, .15)';
export const mobilePageBackground = colorPalette.white;
export const mobileNavBackground = colorPalette.white;
export const mobileNavItem = colorPalette.gray300;
export const mobileNavItemSelected = colorPalette.orange700;
export const mobileAccountShadow = colorPalette.gray200;
export const mobileAccountText = colorPalette.blue800;
export const mobileTransactionSelected = colorPalette.orange500;

// Mobile view themes (for the top bar)
export const mobileViewTheme = mobileHeaderBackground;
export const mobileConfigServerViewTheme = colorPalette.orange700;

export const markdownNormal = colorPalette.orange200;
export const markdownDark = colorPalette.orange700;
export const markdownLight = colorPalette.orange150;

// Button
export const buttonMenuText = colorPalette.gray500;
export const buttonMenuTextHover = colorPalette.gray400;
export const buttonMenuBackground = 'transparent';
export const buttonMenuBackgroundHover = colorPalette.orange50;
export const buttonMenuBorder = colorPalette.gray200;
export const buttonMenuSelectedText = colorPalette.green800;
export const buttonMenuSelectedTextHover = colorPalette.orange800;
export const buttonMenuSelectedBackground = colorPalette.orange150;
export const buttonMenuSelectedBackgroundHover = colorPalette.orange200;
export const buttonMenuSelectedBorder = buttonMenuSelectedBackground;

export const buttonPrimaryText = colorPalette.white;
export const buttonPrimaryTextHover = buttonPrimaryText;
export const buttonPrimaryBackground = colorPalette.orange700;
export const buttonPrimaryBackgroundHover = colorPalette.orange600;
export const buttonPrimaryBorder = buttonPrimaryBackground;
export const buttonPrimaryShadow = 'rgba(0, 0, 0, 0.25)';
export const buttonPrimaryDisabledText = colorPalette.white;
export const buttonPrimaryDisabledBackground = colorPalette.gray300;
export const buttonPrimaryDisabledBorder = buttonPrimaryDisabledBackground;

export const buttonNormalText = pageTextDark;
export const buttonNormalTextHover = buttonNormalText;
export const buttonNormalBackground = colorPalette.white;
export const buttonNormalBackgroundHover = buttonNormalBackground;
export const buttonNormalBorder = colorPalette.gray150;
export const buttonNormalShadow = 'rgba(0, 0, 0, 0.12)';
export const buttonNormalSelectedText = colorPalette.white;
export const buttonNormalSelectedBackground = colorPalette.orange700;
export const buttonNormalDisabledText = colorPalette.gray300;
export const buttonNormalDisabledBackground = buttonNormalBackground;
export const buttonNormalDisabledBorder = buttonNormalBorder;

export const calendarText = pageTextDark;
export const calendarBackground = colorPalette.white;
export const calendarItemText = pageTextDark;
export const calendarItemBackground = colorPalette.gray50;
export const calendarSelectedBackground = colorPalette.orange200;

export const buttonBareText = buttonNormalText;
export const buttonBareTextHover = buttonNormalText;
export const buttonBareBackground = 'transparent';
export const buttonBareBackgroundHover = colorPalette.orange50;
export const buttonBareBackgroundActive = colorPalette.orange100;
export const buttonBareDisabledText = buttonNormalDisabledText;
export const buttonBareDisabledBackground = buttonBareBackground;

export const noticeBackground = colorPalette.green150;
export const noticeBackgroundLight = colorPalette.green100;
export const noticeBackgroundDark = colorPalette.green500;
export const noticeText = colorPalette.green700;
export const noticeTextLight = colorPalette.green500;
export const noticeTextDark = colorPalette.green900;
export const noticeTextMenu = colorPalette.green200;
export const noticeBorder = colorPalette.green500;
export const warningBackground = colorPalette.orange150;
export const warningText = colorPalette.orange800;
export const warningTextLight = colorPalette.orange700;
export const warningTextDark = colorPalette.orange900;
export const warningBorder = colorPalette.orange400;
export const errorBackground = colorPalette.red100;
export const errorText = colorPalette.red500;
export const errorTextDark = colorPalette.red700;
export const errorTextDarker = colorPalette.red900;
export const errorTextMenu = colorPalette.red200;
export const errorBorder = colorPalette.red500;
export const upcomingBackground = colorPalette.orange100;
export const upcomingText = colorPalette.orange900;
export const upcomingBorder = colorPalette.orange300;

export const formLabelText = colorPalette.orange800;
export const formLabelBackground = colorPalette.orange100;
export const formInputBackground = colorPalette.gray50;
export const formInputBackgroundSelected = colorPalette.white;
export const formInputBackgroundSelection = colorPalette.orange200;
export const formInputBorder = colorPalette.gray150;
export const formInputTextReadOnlySelection = colorPalette.gray50;
export const formInputBorderSelected = colorPalette.orange500;
export const formInputText = pageTextDark;
export const formInputTextSelected = pageTextDark;
export const formInputTextPlaceholder = colorPalette.gray400;
export const formInputTextPlaceholderSelected = colorPalette.gray500;
export const formInputTextSelection = colorPalette.orange150;
export const formInputShadowSelected = colorPalette.orange200;
export const formInputTextHighlight = colorPalette.orange700;
export const checkboxText = tableBackground;
export const checkboxBackgroundSelected = colorPalette.orange700;
export const checkboxBorderSelected = colorPalette.orange700;
export const checkboxShadowSelected = colorPalette.orange300;
export const checkboxToggleBackground = colorPalette.gray400;
export const checkboxToggleBackgroundSelected = colorPalette.orange700;
export const checkboxToggleDisabled = colorPalette.gray200;

export const pillBackground = colorPalette.gray100;
export const pillBackgroundLight = colorPalette.gray50;
export const pillText = pageTextDark;
export const pillTextHighlighted = colorPalette.orange800;
export const pillBorder = colorPalette.gray150;
export const pillBorderDark = colorPalette.gray200;
export const pillBackgroundSelected = colorPalette.orange150;
export const pillTextSelected = pageTextDark;
export const pillBorderSelected = colorPalette.orange400;
export const pillTextSubdued = colorPalette.gray400;

export const reportsRed = colorPalette.red300;
export const reportsBlue = colorPalette.blue400;
export const reportsGreen = colorPalette.green400;
export const reportsGray = colorPalette.gray400;
export const reportsLabel = pageTextDark;
export const reportsInnerLabel = pageTextDark;
export const reportsNumberPositive = numberPositive;
export const reportsNumberNegative = numberNegative;
export const reportsNumberNeutral = numberNeutral;
export const reportsChartFill = reportsNumberPositive;

export const noteTagBackground = colorPalette.orange150;
export const noteTagBackgroundHover = colorPalette.orange200;
export const noteTagDefault = colorPalette.orange150;
export const noteTagText = pageTextDark;

export const budgetCurrentMonth = tableBackground;
export const budgetOtherMonth = colorPalette.gray50;
export const budgetHeaderCurrentMonth = budgetOtherMonth;
export const budgetHeaderOtherMonth = colorPalette.gray80;

export const floatingActionBarBackground = colorPalette.orange700;
export const floatingActionBarBorder = colorPalette.orange700;
export const floatingActionBarText = colorPalette.white;

export const tooltipText = pageTextDark;
export const tooltipBackground = colorPalette.white;
export const tooltipBorder = colorPalette.gray150;

export const calendarCellBackground = colorPalette.gray80;

export const overlayBackground = 'rgba(0, 0, 0, 0.3)';
