export interface ResourceArticle {
  id: string;
  title: string;
  category: string;
  readTime: string;
  summary: string;
  keyTakeaways: string[];
  content: string;
}

export const resourcesList: ResourceArticle[] = [
  {
    id: 'res-1',
    title: 'Farm Finance Fundamentals for Nigerian Agribusiness',
    category: 'Farm Finance Fundamentals',
    readTime: '6 min read',
    summary: 'Distinguish between initial capital expenditure, working capital requirements, and biological cycle cash flow.',
    keyTakeaways: [
      'Never allocate all initial capital to land acquisition or fixed machinery.',
      'Maintain at least 25% of your total budget as working capital reserves for input and operational cost inflation.',
      'Biological production does not generate revenue until harvest; timing cash inflows is paramount.'
    ],
    content: `Starting an agricultural venture in Nigeria requires disciplined capital budgeting. Many prospective investors exhaust their funds during clearing and land purchase, leaving insufficient working capital to feed livestock or fertilize crops during the critical mid-season growth phase.

A robust farm budget categorizes expenditures into:
1. Capital Expenditure (Capex): Irrigated infrastructure, fencing, sheds, boreholes.
2. Operating Expenditure (Opex): Seeds, feed, labor, fuel, chemicals, and veterinary care.
3. Reserve Contingency: Minimum 15-20% buffer against weather shocks and market volatility.`
  },
  {
    id: 'res-2',
    title: 'Validating Buyers Before Putting Seeds in the Ground',
    category: 'Finding Customers',
    readTime: '5 min read',
    summary: 'Why an assumed customer is the #1 killer of farm investments and how to obtain verified off-take agreements.',
    keyTakeaways: [
      'An assumed buyer is an untested hypothesis; a validated buyer has agreed pricing, specifications, and volume.',
      'Off-takers look for moisture consistency, grading, and reliability before agreeing to purchase.',
      'Securing purchase intent contracts reduces distress farm-gate sales at harvest time.'
    ],
    content: `Too many agricultural investors plant first and search for buyers when the harvest is wilting in the field. Commercial off-takers such as feed millers, breweries, food packaging companies, and large institutional buyers require specific standards:

- Moisture Content: Commercial maize millers typically require 12% to 14% moisture content maximum.
- Foreign Matter: Grain must be free of stones, mold, and broken chaff.
- Consistent Volume: Buyers prefer predictable delivery schedules.

Always interview at least 3 active commodity traders or processing managers in your region before choosing your crop variety.`
  },
  {
    id: 'res-3',
    title: 'Evaluating Land: Lease vs Buy in Commercial Farming',
    category: 'Farm Investment Planning',
    readTime: '7 min read',
    summary: 'Why leasing or community partnership is frequently more capital-efficient than outright land acquisition for new farmers.',
    keyTakeaways: [
      'In many agricultural states (Oyo, Ogun, Kaduna, Niger), long-term agricultural leases cost ₦25,000 to ₦60,000 per hectare annually.',
      'Buying 10 hectares outright can cost ₦5,000,000 to ₦15,000,000+, consuming capital needed for irrigation and high-yield seeds.',
      'Leasing allows testing soil quality, community relations, and local water security with minimal sunk risk.'
    ],
    content: `Land ownership confers pride, but in commercial agriculture, capital allocation efficiency determines survival. Land that you own outright does not produce crops unless you have the cash remaining for land clearing, tractor services, hybrid seeds, and basal fertilizers.

When should you buy land?
- Permanent perennial crops (oil palm, cocoa, cashew) that take 4 to 20 years.
- Specialized permanent infrastructure (cold storage hubs, industrial livestock pens).

When should you lease or partner?
- Annual grain and legume crops (maize, soybeans, cowpea).
- Pilot farming operations in a new ecological zone.
- When your available capital is under ₦10,000,000.`
  },
  {
    id: 'res-4',
    title: 'Managing Agricultural Risks in the Tropical Belt',
    category: 'Managing Farm Risk',
    readTime: '8 min read',
    summary: 'Practical controls for drought, fall armyworm, price collapse, cattle encroachment, and post-harvest spoilage.',
    keyTakeaways: [
      'Supplementary drip or furrow irrigation turns farming from a weather gamble into a manageable business.',
      'Combine biological scouting with chemical rotation to avoid pest resistance.',
      'Take advantage of subsidized agricultural insurance through the Nigerian Agricultural Insurance Corporation (NAIC).'
    ],
    content: `Risk cannot be eliminated, but it can be bounded. The three most severe risks in Nigerian crop production are erratic rainfall onset, aggressive pest outbreaks (such as Fall Armyworm and stem borers), and post-harvest price depression during national harvest peaks.

Establishing a water pond or borehole with booster pumps provides life-saving moisture during mid-season dry spells. Furthermore, hermetic storage bags (PICS bags) allow holding dry grains for 3 to 6 months until market supply tightens and prices surge.`
  },
  {
    id: 'res-5',
    title: 'Practical Farm Record Keeping and Cash Flow Monitoring',
    category: 'Record Keeping',
    readTime: '4 min read',
    summary: 'Simple daily protocols to prevent leakage, verify worker attendance, and track real unit costs.',
    keyTakeaways: [
      'A farm without daily logs is impossible to audit or scale.',
      'Record physical input usage alongside financial expenditure.',
      'Track mortality and feed conversion ratios (FCR) weekly for livestock and fish.'
    ],
    content: `Effective agricultural record keeping does not require complex ERP software. A disciplined physical logbook with standardized daily sheets for:
1. Daily worker attendance and specific tasks completed (ridging, spraying, weeding).
2. Input inventory issued from the farm store (liters of herbicide, bags of fertilizer).
3. Rainfall log and irrigation runtime hours.
4. Fuel consumption logs for tractors and generators.

These four simple logs prevent up to 80% of common farm operational leaks and ghost expenditures.`
  },
  {
    id: 'res-6',
    title: 'Understanding Break-Even Economics for Farm Investors',
    category: 'Farm Finance Fundamentals',
    readTime: '6 min read',
    summary: 'How to calculate your safety buffer in tonnes or kilograms before committing capital.',
    keyTakeaways: [
      'Break-even quantity tells you how much yield is consumed merely paying for your costs.',
      'If your break-even yield is 80% of regional maximum yield, your margin of safety is razor thin.',
      'Aim for a production model where break-even is achieved at 40-55% of expected output.'
    ],
    content: `Break-even analysis answers the most critical investor question: 'What is the minimum harvest I must sell to not lose my capital?'

Fixed costs include permanent manager salary, land lease, borehole maintenance, and security. Variable costs include seed, fertilizer, bags, and harvest labor. By understanding your contribution margin per kilogram or tonne, you can immediately assess whether your projected yields provide an adequate cushion against bad weather or price dips.`
  }
];
