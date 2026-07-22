'use client'
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface MultiSelectItem {
  id: number;
  name: string;
}

interface MultiSelectProps {
  items: MultiSelectItem[];
  selected: number[];
  onChange: (ids: number[]) => void;
  placeholder?: string;
}

export function MultiSelect({ items, selected, onChange, placeholder = 'Seleccionar...' }: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const selectedItems = items.filter(i => selected.includes(i.id));

  const toggle = (id: number) => {
    onChange(selected.includes(id) ? selected.filter(s => s !== id) : [...selected, id]);
  };

  const remove = (id: number) => onChange(selected.filter(s => s !== id));

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal"
          >
            {selectedItems.length > 0 ? `${selectedItems.length} seleccionado${selectedItems.length > 1 ? 's' : ''}` : placeholder}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder="Buscar..." />
            <CommandList>
              <CommandEmpty>Sin resultados.</CommandEmpty>
              <CommandGroup>
                {items.map(item => {
                  const isSelected = selected.includes(item.id);
                  return (
                    <CommandItem key={item.id} value={item.name} onSelect={() => toggle(item.id)}>
                      <Check className={cn('mr-2 h-4 w-4', isSelected ? 'opacity-100' : 'opacity-0')} />
                      {item.name}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedItems.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedItems.map(item => (
            <Badge key={item.id} variant="secondary" className="gap-1 pr-1">
              {item.name}
              <button type="button" onClick={() => remove(item.id)} className="rounded-full hover:bg-gray-300/50 p-0.5">
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
