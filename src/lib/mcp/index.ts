import { defineMcp } from "@lovable.dev/mcp-js";
import searchTool from "./tools/search-facilities";
import getFacilityTool from "./tools/get-facility";
import countyResourcesTool from "./tools/county-resources";

export default defineMcp({
  name: "arkansassober-com",
  title: "SoberArkansas.com",
  version: "1.0.0",
  instructions:
    "Public, read-only directory of Arkansas sober living homes and addiction treatment centers, plus county counselor resources. Search facilities, fetch details by id, or look up a county's access and crisis lines. Advise users to call facilities to confirm availability; in an emergency call 988 or 911.",
  tools: [searchTool, getFacilityTool, countyResourcesTool],
});
