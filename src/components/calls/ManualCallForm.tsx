
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { CalendarIcon } from 'lucide-react';
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

const ManualCallForm: React.FC<ManualCallFormProps> = ({
  formData,
  date,
  isLoading,
  setDate,
  handleInputChange,
  handleManualSubmit
}) => {
  return (
    <Card className="glass-morphism">
      <CardHeader>
        <CardTitle>Initiate a Call</CardTitle>
        <CardDescription>
          Fill out this form to manually initiate an AI call
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleManualSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                placeholder="Contact name"
                className="bg-zinc-900 border-zinc-800 focus:border-purple"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                required
                placeholder="+1 (555) 123-4567"
                className="bg-zinc-900 border-zinc-800 focus:border-purple"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="appointmentDate">Appointment Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal bg-zinc-900 border-zinc-800 hover:bg-zinc-800 focus:ring-0 focus:ring-offset-0",
                      !date && "text-zinc-500"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Select date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-zinc-900 border border-zinc-800">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                    className="bg-zinc-900 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="appointmentTime">Appointment Time</Label>
              <Input
                id="appointmentTime"
                name="appointmentTime"
                value={formData.appointmentTime}
                onChange={handleInputChange}
                required
                placeholder="10:00 AM"
                className="bg-zinc-900 border-zinc-800 focus:border-purple"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleInputChange}
              placeholder="Details about the appointment"
              className="min-h-24 bg-zinc-900 border-zinc-800 focus:border-purple"
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full bg-purple hover:bg-purple-dark text-white" 
            disabled={isLoading}
          >
            {isLoading ? 'Initiating Call...' : 'Initiate Call'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ManualCallForm;
