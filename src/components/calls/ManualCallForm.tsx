
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { CalendarIcon, Phone } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { CallFormData } from '@/types/call';

interface ManualCallFormProps {
  formData: CallFormData;
  date: Date | undefined;
  isLoading: boolean;
  setDate: (date: Date | undefined) => void;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleManualSubmit: (e: React.FormEvent) => Promise<void>;
}

/**
 * ManualCallForm component for initiating AI calls
 * Responsive layout for mobile and desktop
 */
const ManualCallForm: React.FC<ManualCallFormProps> = ({
  formData,
  date,
  isLoading,
  setDate,
  handleInputChange,
  handleManualSubmit
}) => {
  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <div className="bg-muted p-2 rounded-full">
            <Phone className="h-4 w-4 text-primary" />
          </div>
          <div>
            <CardTitle>Initiate a Call</CardTitle>
            <CardDescription>
              Fill out this form to manually initiate an AI call
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleManualSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                placeholder="Contact name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phoneNumber" className="text-sm font-medium">Phone Number</Label>
              <Input
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                required
                placeholder="+1 (555) 123-4567"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="appointmentDate" className="text-sm font-medium">Appointment Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Select date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="appointmentTime" className="text-sm font-medium">Appointment Time</Label>
              <Input
                id="appointmentTime"
                name="appointmentTime"
                value={formData.appointmentTime}
                onChange={handleInputChange}
                required
                placeholder="10:00 AM"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="message" className="text-sm font-medium">Message</Label>
            <Textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleInputChange}
              placeholder="Details about the appointment"
              className="min-h-[100px]"
            />
          </div>
          
          <Button 
            type="submit" 
            disabled={isLoading} 
            className="w-full sm:w-auto"
          >
            {isLoading ? "Initiating Call..." : "Initiate Call"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ManualCallForm;
