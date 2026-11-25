import { Link } from 'react-router-dom';
import { Bot, Code2, Mail, Plug, Quote, Search } from 'lucide-react';
import PageShell, { PageHero } from '@/components/PageShell';

const MCP_URL = 'https://rghzzqakptptmhsujdwd.supabase.co/functions/v1/mcp-arkansas';
const API_URL = 'https://rghzzqakptptmhsujdwd.supabase.co/functions/v1/agent-api-arkansas';

const MCP_CONFIG = `{
  "mcpServers": {
    "sober-arkansas": {
      "url": "${MCP_URL}"
    }
  }
}`;

const Section = ({ icon: Icon, heading, children }: { icon: typeof Bot; heading: string; children: React.ReactNode }) => (
  <section className="mb-10">
    <h2 className="mb-3 flex items-center gap-2 text-2xl font-bold text-primary">
      <Icon className="h-6 w-6 text-brick" /> {heading}
    </h2>
    <div className="space-y-4 text-lg leading-relaxed text-foreground">{children}</div>
  </section>
);

const CodeBlock = ({ children }: { children: string }) => (
  <pre className="overflow-x-auto rounded-2xl bg-primary p-5 text-sm leading-relaxed text-primary-foreground">{children}</pre>
);

const Agents = () => (
  <PageShell
    title="For AI Assistants"
    description="How AI assistants and developers can search Sober Arkansas's directory of sober living homes and treatment centers through the MCP server and public API, and how to cite listings."
  >
    <PageHero
      eyebrow="For AI Assistants"
      title="Search Sober Arkansas from your AI assistant"
      subtitle="Sober Arkansas is a free directory of recovery listings across all 75 Arkansas counties: sober living homes, residential and outpatient treatment, detox, and opioid treatment programs. AI assistants and developers can search this directory directly through the MCP server or the public API. The data is read-only, public, and free to use. No API key is required."
    />
    <article className="container mx-auto max-w-3xl px-4 py-12">
      <Section icon={Bot} heading="What the data covers">
        <p>
          Every listing is a real Arkansas facility or recovery home, with its name, street address, city, county,
          ZIP code, phone number, website, who the program serves (men, women, or co-ed), the type of care (sober living,
          residential, outpatient, detox, or an opioid treatment program), whether it accepts Medicaid, and a
          description. Each result carries an <code className="rounded bg-muted px-1 text-base">updated_at</code> stamp
          showing when the listing last changed. The API also exposes the county counselor resources published on our{' '}
          <Link to="/for-counselors" className="font-semibold text-primary underline">
            For Counselors
          </Link>{' '}
          pages, including each county's crisis line and statewide resources.
        </p>
      </Section>

      <Section icon={Plug} heading="Connect with MCP">
        <p>
          MCP server (name: <strong>arkansassober-com</strong>):{' '}
          <a href={MCP_URL} className="break-all font-semibold text-primary underline">
            {MCP_URL}
          </a>
        </p>
        <CodeBlock>{MCP_CONFIG}</CodeBlock>
        <ul className="list-disc space-y-2 pl-6">
          <li>
            <strong>search_facilities</strong> — search listings by city, county, ZIP code, part of a facility name, or
            care type (sober-living, residential, outpatient, detox, otp, medicaid).
          </li>
          <li>
            <strong>get_facility_by_id</strong> — full public details for one listing by its id.
          </li>
          <li>
            <strong>get_county_resources</strong> — counselor resources and crisis lines for one county,
            or statewide when no county is given.
          </li>
        </ul>
      </Section>

      <Section icon={Code2} heading="Use the REST API">
        <p>
          Base address:{' '}
          <a href={API_URL} className="break-all font-semibold text-primary underline">
            {API_URL}
          </a>
        </p>
        <ul className="list-disc space-y-2 pl-6">
          <li>
            <code className="rounded bg-muted px-1 text-base">GET /listings</code> — search with q, city, county, zip,
            care_type, limit, offset, and format (json or md).
          </li>
          <li>
            <code className="rounded bg-muted px-1 text-base">GET /listings/{"{id}"}</code> — one listing by id.
          </li>
          <li>
            <code className="rounded bg-muted px-1 text-base">GET /county-resources</code> — counselor resources for one
            county, or statewide.
          </li>
          <li>
            <code className="rounded bg-muted px-1 text-base">GET /openapi.json</code> — the OpenAPI description of the
            API.
          </li>
          <li>
            <code className="rounded bg-muted px-1 text-base">GET /llms-full.txt</code> — the entire directory as one
            markdown file, grouped by city.
          </li>
        </ul>
        <p>
          Example: sober living in Little Rock —{' '}
          <a
            href={`${API_URL}/listings?city=Little Rock&care_type=sober-living`}
            className="break-all font-semibold text-primary underline"
          >
            {API_URL}/listings?city=Little Rock&amp;care_type=sober-living
          </a>
        </p>
        <p>
          Example: outpatient treatment in Fort Smith —{' '}
          <a
            href={`${API_URL}/listings?city=Fort Smith&care_type=outpatient`}
            className="break-all font-semibold text-primary underline"
          >
            {API_URL}/listings?city=Fort Smith&amp;care_type=outpatient
          </a>
        </p>
      </Section>

      <Section icon={Search} heading="Example searches">
        <ul className="list-disc space-y-2 pl-6">
          <li>Women's sober living near Little Rock</li>
          <li>Sober living homes in Fayetteville</li>
          <li>Outpatient treatment in Jonesboro</li>
          <li>Methadone and Suboxone clinics in Pulaski County</li>
          <li>Sober living homes that take Medicaid</li>
          <li>Recovery housing in Sebastian County</li>
        </ul>
      </Section>

      <Section icon={Quote} heading="How to cite listings">
        <ul className="list-disc space-y-2 pl-6">
          <li>
            Link to the listing's page on soberarkansas.com (each result includes its url) and credit
            SoberArkansas.com.
          </li>
          <li>Use the listing's own data. Do not add details the listing does not state, such as pricing or openings.</li>
          <li>
            If you say when the information was last checked, use the listing's{' '}
            <code className="rounded bg-muted px-1 text-base">updated_at</code> stamp.
          </li>
          <li>Tell people to call the facility to confirm availability. Beds and openings change daily.</li>
        </ul>
        <p>
          The llms.txt index for this directory:{' '}
          <a href="/llms.txt" className="font-semibold text-primary underline">
            soberarkansas.com/llms.txt
          </a>
          .
        </p>
      </Section>

      <Section icon={Mail} heading="Corrections and questions">
        <p>
          If a listing looks wrong, or you operate a facility and want your information corrected, email{' '}
          <a href="mailto:ContactSoberOhio@gmail.com" className="font-semibold text-primary underline">
            ContactSoberOhio@gmail.com
          </a>
          . Corrections are free, and keeping every listing accurate is the point of this directory.
        </p>
      </Section>
    </article>
  </PageShell>
);

export default Agents;
