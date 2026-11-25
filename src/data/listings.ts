export interface SoberLivingHome {
  id: string;
  name: string;
  city: string;
  address: string;
  phone: string;
  description: string;
  features: string[];
  gender: 'men' | 'women' | 'co-ed';
  image: string;
  images: string[];
  priceRange: string;
  lat: number;
  lng: number;
  category: string[];
  acceptsPrivatePay: boolean;
  acceptsMedicaid: boolean;
  lengthOfStay: string;
  matAvailable: boolean;
  insuranceVerificationUrl: string;
  detoxAvailable: boolean;
  levelPhp: boolean;
  levelIop: boolean;
  levelOp: boolean;
  telehealthAvailable: boolean;
  eveningGroups: boolean;
  website: string;
  /** Extended boolean facility fields – keys are camelCase versions of DB columns */
  [key: string]: any;
}

export const arkansasCities = ['All Cities', 'Little Rock', 'Fort Smith', 'Conway', 'Springdale', 'Jonesboro', 'North Little Rock', 'Hot Springs National Park', 'Fayetteville', 'Texarkana', 'Pine Bluff', 'Bentonville', 'Rogers', 'Russellville', 'Hot Springs', 'Harrison', 'Searcy', 'Van Buren', 'Camden', 'Clarksville', 'Crossett', 'Booneville', 'West Memphis', 'Hardy', 'Warren', 'Mountain Home'];
