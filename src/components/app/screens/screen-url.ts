/** Public address of a screen. `appUrl` is the configured APP_URL, without trailing slash. */
export function screenUrl(appUrl: string, publicToken: string): string {
  return `${appUrl}/d/${publicToken}`;
}
