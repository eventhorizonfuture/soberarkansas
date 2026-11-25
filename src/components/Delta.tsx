/**
 * Delta mark for the SoberArkansas identity: a flat lowland horizon —
 * pale river-mist sky, a harvest-gold sun sitting low, one flat band of
 * delta fields, then two broad river bands deepening from river blue to
 * deep delta navy in front. No hills; the land is flat and the water is
 * the picture, echoing the Mississippi Delta lowlands.
 */
const Delta = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 1440 240" preserveAspectRatio="none" className={className} aria-hidden="true" role="presentation" focusable="false">
    {/* sky, pale river mist */}
    <rect x="0" y="0" width="1440" height="240" fill="hsl(204 56% 91%)" />
    {/* harvest-gold sun, low on the horizon */}
    <circle cx="1150" cy="86" r="40" fill="hsl(39 67% 55%)" />
    {/* flat field band along the horizon */}
    <rect x="0" y="118" width="1440" height="26" fill="hsl(95 29% 55%)" />
    {/* first river band, river blue */}
    <path d="M0,158 C180,146 360,168 560,158 C760,148 940,168 1140,158 C1260,152 1360,164 1440,158 L1440,240 L0,240 Z" fill="hsl(200 51% 37%)" />
    {/* front river band, deep delta navy */}
    <path d="M0,196 C220,182 460,204 700,192 C940,180 1100,202 1280,192 C1350,188 1400,196 1440,192 L1440,240 L0,240 Z" fill="hsl(207 61% 23%)" />
  </svg>
);

export default Delta;
