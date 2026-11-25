import { arkansasCities } from '@/data/listings';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface FilterBarProps {
  selectedCity: string;
  onCityChange: (city: string) => void;
  selectedGender: string;
  onGenderChange: (gender: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

const genderOptions = ['All', 'Men', 'Women', 'Co-Ed'];
const categoryOptions = [
  { value: 'all', label: 'All Categories' },
  { value: 'inpatient', label: 'Inpatient' },
  { value: 'outpatient', label: 'Outpatient' },
  { value: 'sober-living', label: 'Sober Living' },
];

const FilterBar = ({ selectedCity, onCityChange, selectedGender, onGenderChange, selectedCategory, onCategoryChange }: FilterBarProps) => {
  return (
    <div className="border-b bg-card px-4 py-3">
      <div className="container mx-auto flex flex-col gap-2 sm:gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="flex items-center gap-2">
            <Select value={selectedCategory} onValueChange={onCategoryChange}>
              <SelectTrigger className="w-[160px] h-9 rounded-full text-sm">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                {categoryOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 gap-1.5 sm:flex sm:flex-wrap sm:gap-2 w-full sm:w-auto">
       {arkansasCities.map((city) => (
              <Button
                key={city}
                variant={selectedCity === city ? 'default' : 'outline'}
                size="sm"
                onClick={() => onCityChange(city)}
                className="rounded-full text-xs sm:text-sm h-8 px-3"
              >
                {city}
              </Button>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          {genderOptions.map((g) => (
            <Button
              key={g}
              variant={selectedGender === g ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => onGenderChange(g)}
              className="text-xs sm:text-sm h-8"
            >
              {g}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
