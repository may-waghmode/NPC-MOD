/**
 * AppIcon — central icon registry.
 * Maps string identifiers → react-icons components.
 * No emojis anywhere. Ever.
 */
import {
  RiFireFill,
  RiBarChartFill,
  RiGlobalFill,
  RiTrophyFill,
  RiShieldFill,
  RiFileTextFill,
  RiCameraFill,
  RiCheckboxCircleFill,
  RiSettings4Fill,
  RiLockFill,
  RiQuestionFill,
  RiMailFill,
  RiLogoutBoxRFill,
  RiBook2Fill,
  RiMoonFill,
  RiSunFill,
  RiFlashlightFill,
  RiSwordFill,
  RiGroupFill,
  RiMedalFill,
  RiAlertFill,
  RiCheckFill,
  RiSendPlaneFill,
  RiGamepadFill,
  RiUserStarFill,
  RiArrowLeftLine,
  RiRefreshLine,
  RiCloseLine,
} from 'react-icons/ri';

import {
  GiCrossedSwords,
  GiSkullCrossedBones,
  GiPerspectiveDiceThree,
  GiWeightLiftingUp,
} from 'react-icons/gi';

const ICON_MAP = {
  // quest categories / skill rings
  dumbbell:   GiWeightLiftingUp,
  book:        RiBook2Fill,
  dice:        GiPerspectiveDiceThree,
  sword:       GiCrossedSwords,
  users:       RiGroupFill,
  // boss
  skull:       GiSkullCrossedBones,
  // achievements
  trophy:      RiTrophyFill,
  moon:        RiMoonFill,
  medal:       RiMedalFill,
  // UI
  fire:        RiFireFill,
  chart:       RiBarChartFill,
  global:      RiGlobalFill,
  shield:      RiShieldFill,
  scroll:      RiFileTextFill,
  camera:      RiCameraFill,
  check:       RiCheckboxCircleFill,
  settings:    RiSettings4Fill,
  lock:        RiLockFill,
  help:        RiQuestionFill,
  mail:        RiMailFill,
  logout:      RiLogoutBoxRFill,
  flash:       RiFlashlightFill,
  gamepad:     RiGamepadFill,
  star:        RiUserStarFill,
  alert:       RiAlertFill,
  tick:        RiCheckFill,
  send:        RiSendPlaneFill,
  back:        RiArrowLeftLine,
  refresh:     RiRefreshLine,
  close:       RiCloseLine,
  sun:         RiSunFill,
  swords:      GiCrossedSwords,
};

export default function AppIcon({ name, size = 16, color, className, style }) {
  const Icon = ICON_MAP[name];
  if (!Icon) return null;
  return <Icon size={size} color={color} className={className} style={style} />;
}
