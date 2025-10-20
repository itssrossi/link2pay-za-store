export interface BadgeUnlockData {
  badgeId: string;
  badgeName: string;
  badgeDescription: string;
  badgeIcon: string;
  badgeColor: string;
  points: number;
}

export const triggerBadgeUnlockModal = (badgeData: BadgeUnlockData) => {
  const event = new CustomEvent('badgeUnlocked', { 
    detail: badgeData 
  });
  window.dispatchEvent(event);
};
