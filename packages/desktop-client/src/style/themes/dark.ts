// oxlint-disable-next-line eslint/no-restricted-imports
import * as colorPalette from '@desktop-client/style/palette';

// White-label dark theme (calmer): near-black surfaces with purple + orange accents.
// Matches the feel of the provided screenshot (dark gray base, purple accent bars).
export const pageBackground = colorPalette.gray900;
export const pageBackgroundModalActive = colorPalette.gray800;
export const pageBackgroundTopLeft = colorPalette.gray900;
export const pageBackgroundBottomRight = colorPalette.gray800;
export const pageBackgroundLineTop = colorPalette.purple300;
export const pageBackgroundLineMid = colorPalette.gray900;
export const pageBackgroundLineBottom = colorPalette.gray700;
export const pageText = colorPalette.gray100;
export const pageTextLight = colorPalette.gray200;
export const pageTextSubdued = colorPalette.gray400;
export const pageTextDark = colorPalette.white;
export const pageTextPositive = colorPalette.green300;
export const pageTextLink = colorPalette.orange400;
export const pageTextLinkLight = colorPalette.orange300;

export const cardBackground = colorPalette.gray800;
export const cardBorder = colorPalette.gray700;
export const cardShadow = 'rgba(0, 0, 0, 0.55)';

export const tableBackground = colorPalette.gray800;
export const tableRowBackgroundHover = colorPalette.gray700;
export const tableText = pageText;
export const tableTextLight = tableText;
export const tableTextSubdued = colorPalette.gray400;
export const tableTextSelected = pageTextDark;
export const tableTextHover = colorPalette.gray150;
export const tableTextInactive = colorPalette.gray400;
export const tableHeaderText = colorPalette.gray200;
export const tableHeaderBackground = colorPalette.gray900;
export const tableBorder = colorPalette.gray700;
export const tableBorderSelected = colorPalette.orange500;
export const tableBorderHover = colorPalette.orange400;
export const tableBorderSeparator = colorPalette.gray600;
export const tableRowBackgroundHighlight = colorPalette.purple900;
export const tableRowBackgroundHighlightText = pageText;
export const tableRowHeaderBackground = colorPalette.gray900;
export const tableRowHeaderText = pageText;

export const numberPositive = colorPalette.green300;
export const numberNegative = colorPalette.red200;
export const numberNeutral = colorPalette.gray500;
export const budgetNumberNegative = numberNegative;
export const budgetNumberZero = tableTextSubdued;
export const budgetNumberNeutral = tableText;
export const budgetNumberPositive = budgetNumberNeutral;
export const templateNumberFunded = numberPositive;
export const templateNumberUnderFunded = colorPalette.orange300;
export const toBudgetPositive = numberPositive;
export const toBudgetZero = numberPositive;
export const toBudgetNegative = budgetNumberNegative;

export const sidebarBackground = colorPalette.gray900;
export const sidebarItemBackgroundPending = colorPalette.orange800;
export const sidebarItemBackgroundPositive = colorPalette.green500;
export const sidebarItemBackgroundFailed = colorPalette.red300;
export const sidebarItemAccentSelected = colorPalette.purple300;
export const sidebarItemBackgroundHover = colorPalette.gray800;
export const sidebarItemText = colorPalette.gray100;
export const sidebarItemTextSelected = colorPalette.gray100;
export const sidebarBudgetName = colorPalette.gray200;

export const menuBackground = colorPalette.gray900;
export const menuItemBackground = colorPalette.gray800;
export const menuItemBackgroundHover = colorPalette.gray700;
export const menuItemText = colorPalette.gray100;
export const menuItemTextHover = colorPalette.white;
export const menuItemTextSelected = colorPalette.orange300;
export const menuItemTextHeader = colorPalette.gray300;
export const menuBorder = colorPalette.gray700;
export const menuBorderHover = colorPalette.purple300;
export const menuKeybindingText = colorPalette.gray300;
export const menuAutoCompleteBackground = colorPalette.gray900;
export const menuAutoCompleteBackgroundHover = colorPalette.gray800;
export const menuAutoCompleteText = colorPalette.gray100;
export const menuAutoCompleteTextHeader = colorPalette.orange200;
export const menuAutoCompleteItemText = menuItemText;

export const modalBackground = colorPalette.gray800;
export const modalBorder = colorPalette.gray700;
export const mobileHeaderBackground = colorPalette.gray900;
export const mobileHeaderText = colorPalette.white;
export const mobileHeaderTextSubdued = colorPalette.gray200;
export const mobileHeaderTextHover = 'rgba(200, 200, 200, .15)';
export const mobilePageBackground = colorPalette.gray900;
export const mobileNavBackground = colorPalette.gray900;
export const mobileNavItem = colorPalette.gray150;
export const mobileNavItemSelected = colorPalette.purple300;
export const mobileAccountShadow = cardShadow;
export const mobileAccountText = colorPalette.gray100;
export const mobileTransactionSelected = colorPalette.purple300;

// Mobile view themes (for the top bar)
export const mobileViewTheme = mobileHeaderBackground;
export const mobileConfigServerViewTheme = colorPalette.purple300;

export const markdownNormal = colorPalette.purple300;
export const markdownDark = colorPalette.purple400;
export const markdownLight = colorPalette.purple200;

// Button
export const buttonMenuText = colorPalette.gray200;
export const buttonMenuTextHover = colorPalette.white;
export const buttonMenuBackground = 'transparent';
export const buttonMenuBackgroundHover = 'rgba(255, 255, 255, 0.08)';
export const buttonMenuBorder = colorPalette.gray700;
export const buttonMenuSelectedText = colorPalette.green150;
export const buttonMenuSelectedTextHover = colorPalette.orange100;
export const buttonMenuSelectedBackground = colorPalette.orange800;
export const buttonMenuSelectedBackgroundHover = colorPalette.orange700;
export const buttonMenuSelectedBorder = buttonMenuSelectedBackground;

export const buttonPrimaryText = colorPalette.white;
export const buttonPrimaryTextHover = buttonPrimaryText;
export const buttonPrimaryBackground = colorPalette.orange500;
export const buttonPrimaryBackgroundHover = colorPalette.orange400;
export const buttonPrimaryBorder = buttonPrimaryBackground;
export const buttonPrimaryShadow = 'rgba(0, 0, 0, 0.55)';
export const buttonPrimaryDisabledText = colorPalette.gray400;
export const buttonPrimaryDisabledBackground = colorPalette.gray700;
export const buttonPrimaryDisabledBorder = buttonPrimaryDisabledBackground;

export const buttonNormalText = colorPalette.gray100;
export const buttonNormalTextHover = colorPalette.white;
export const buttonNormalBackground = colorPalette.gray800;
export const buttonNormalBackgroundHover = colorPalette.gray700;
export const buttonNormalBorder = colorPalette.gray700;
export const buttonNormalShadow = 'rgba(0, 0, 0, 0.35)';
export const buttonNormalSelectedText = colorPalette.white;
export const buttonNormalSelectedBackground = colorPalette.purple300;
export const buttonNormalDisabledText = colorPalette.gray500;
export const buttonNormalDisabledBackground = colorPalette.gray800;
export const buttonNormalDisabledBorder = colorPalette.gray700;

export const calendarText = colorPalette.gray100;
export const calendarBackground = colorPalette.gray900;
export const calendarItemText = colorPalette.gray150;
export const calendarItemBackground = colorPalette.gray800;
export const calendarSelectedBackground = buttonNormalSelectedBackground;

export const buttonBareText = buttonNormalText;
export const buttonBareTextHover = buttonNormalTextHover;
export const buttonBareBackground = 'transparent';
export const buttonBareBackgroundHover = 'rgba(255, 255, 255, 0.08)';
export const buttonBareBackgroundActive = 'rgba(255, 255, 255, 0.12)';
export const buttonBareDisabledText = buttonNormalDisabledText;
export const buttonBareDisabledBackground = buttonBareBackground;

export const noticeBackground = colorPalette.green800;
export const noticeBackgroundLight = colorPalette.green900;
export const noticeBackgroundDark = colorPalette.green500;
export const noticeText = colorPalette.green300;
export const noticeTextLight = colorPalette.green500;
export const noticeTextDark = colorPalette.green150;
export const noticeTextMenu = colorPalette.green500;
export const noticeBorder = colorPalette.green800;
export const warningBackground = colorPalette.orange800;
export const warningText = colorPalette.orange200;
export const warningTextLight = colorPalette.orange300;
export const warningTextDark = colorPalette.orange100;
export const warningBorder = colorPalette.orange500;
export const errorBackground = colorPalette.red800;
export const errorText = colorPalette.red200;
export const errorTextDark = colorPalette.red150;
export const errorTextDarker = errorTextDark;
export const errorTextMenu = colorPalette.red200;
export const errorBorder = colorPalette.red500;
export const upcomingBackground = colorPalette.purple900;
export const upcomingText = colorPalette.purple150;
export const upcomingBorder = tableBorder;

export const formLabelText = colorPalette.purple200;
export const formLabelBackground = colorPalette.gray900;
export const formInputBackground = colorPalette.gray900;
export const formInputBackgroundSelected = colorPalette.gray800;
export const formInputBackgroundSelection = colorPalette.purple300;
// Slightly lighter than surfaces so unfocused inputs are still visible
export const formInputBorder = colorPalette.gray600;
export const formInputTextReadOnlySelection = colorPalette.gray900;
export const formInputBorderSelected = colorPalette.orange500;
export const formInputText = colorPalette.gray100;
export const formInputTextSelected = colorPalette.gray900;
export const formInputTextPlaceholder = colorPalette.gray300;
export const formInputTextPlaceholderSelected = colorPalette.gray200;
export const formInputTextSelection = colorPalette.gray900;
export const formInputShadowSelected = colorPalette.purple200;
export const formInputTextHighlight = colorPalette.orange300;
export const checkboxText = tableText;
export const checkboxBackgroundSelected = colorPalette.orange500;
export const checkboxBorderSelected = colorPalette.orange500;
export const checkboxShadowSelected = colorPalette.orange300;
export const checkboxToggleBackground = colorPalette.gray700;
export const checkboxToggleBackgroundSelected = colorPalette.purple300;
export const checkboxToggleDisabled = colorPalette.gray600;

export const pillBackground = colorPalette.gray800;
export const pillBackgroundLight = colorPalette.gray900;
export const pillText = colorPalette.gray200;
export const pillTextHighlighted = colorPalette.orange200;
export const pillBorder = colorPalette.gray700;
export const pillBorderDark = pillBorder;
export const pillBackgroundSelected = colorPalette.purple300;
export const pillTextSelected = colorPalette.white;
export const pillBorderSelected = colorPalette.purple200;
export const pillTextSubdued = colorPalette.gray400;

export const reportsRed = colorPalette.red300;
export const reportsBlue = colorPalette.blue400;
export const reportsGreen = colorPalette.green400;
export const reportsGray = colorPalette.gray400;
export const reportsLabel = pageText;
export const reportsInnerLabel = colorPalette.gray100;
export const reportsNumberPositive = numberPositive;
export const reportsNumberNegative = numberNegative;
export const reportsNumberNeutral = numberNeutral;
export const reportsChartFill = reportsNumberPositive;

export const noteTagBackground = colorPalette.purple800;
export const noteTagBackgroundHover = colorPalette.purple700;
export const noteTagDefault = colorPalette.purple800;
export const noteTagText = colorPalette.gray100;

export const budgetOtherMonth = colorPalette.gray900;
export const budgetCurrentMonth = tableBackground;
export const budgetHeaderOtherMonth = colorPalette.gray800;
export const budgetHeaderCurrentMonth = tableHeaderBackground;

export const floatingActionBarBackground = colorPalette.gray900;
export const floatingActionBarBorder = colorPalette.purple300;
export const floatingActionBarText = colorPalette.gray100;

export const tooltipText = colorPalette.gray100;
export const tooltipBackground = colorPalette.gray900;
export const tooltipBorder = colorPalette.gray700;

export const calendarCellBackground = colorPalette.gray900;

export const overlayBackground = 'rgba(0, 0, 0, 0.3)';
