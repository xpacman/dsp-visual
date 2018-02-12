
/* MAIN ACTIONS */
export const COLLAPSE_MENU = 'COLLAPSE_MENU';

/**
 * Action creator for collapsing and expanding side menu
 * @param collapse bool
 * @returns {{type: string, state: *}}
 */
export function collapseMenu(collapse) {
  return {
    type: COLLAPSE_MENU,
    payload: collapse
  };
}

