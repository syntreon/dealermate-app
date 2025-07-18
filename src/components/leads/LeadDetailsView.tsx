import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { useAuth } from '@/context/AuthContext';
import { canViewSensitiveInfo } from '@/utils/clientDataIsolation';
import { formatCustomLeadData, combineNotesWithCustomData } from '@/utils/leadDataFormatter';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import {
    Phone,
    User,
    Calendar,
    Mail,
    FileText,
    X,
    Edit,
    Save,
    ExternalLink,
    MessageSquare,
    Clock,
    PhoneCall,
    Link,
} from 'lucide-react';
import { Lead as ContextLead } from '@/context/LeadContext';
import { Lead as SupabaseLead } from '@/integrations/supabase/lead-service';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface LeadDetailsViewProps {
    lead: SupabaseLead | null;
    isOpen: boolean;
    onClose: () => void;
    onStatusChange: (lead: SupabaseLead, status: SupabaseLead['status']) => Promise<void>;
    onAddNote: (lead: SupabaseLead, note: string) => Promise<void>;
    clientName?: string; // Optional client name to display instead of ID
}

const LeadDetailsView: React.FC<LeadDetailsViewProps> = ({
    lead,
    isOpen,
    onClose,
    onStatusChange,
    onAddNote,
    clientName,
}) => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('details');
    const [newNote, setNewNote] = useState('');
    const [isAddingNote, setIsAddingNote] = useState(false);

    // Get status badge
    const getStatusBadge = (status: string) => {
        // Normalize status to handle any case variations
        const normalizedStatus = status?.toLowerCase() || 'unknown';
        
        const statusConfig: Record<string, { color: string, label: string }> = {
            'new': { color: 'bg-blue-100 text-blue-800 border-blue-200', label: 'New' },
            'contacted': { color: 'bg-purple-100 text-purple-800 border-purple-200', label: 'Contacted' },
            'qualified': { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', label: 'Qualified' },
            'proposal': { color: 'bg-orange-100 text-orange-800 border-orange-200', label: 'Proposal' },
            'closed_won': { color: 'bg-green-100 text-green-800 border-green-200', label: 'Closed (Won)' },
            'closed': { color: 'bg-green-100 text-green-800 border-green-200', label: 'Closed' },
            'closed_lost': { color: 'bg-red-100 text-red-800 border-red-200', label: 'Closed (Lost)' },
            'lost': { color: 'bg-red-100 text-red-800 border-red-200', label: 'Lost' }
        };

        const config = statusConfig[normalizedStatus] || { color: 'bg-gray-100 text-gray-800 border-gray-200', label: 'Unknown' };

        return (
            <Badge className={cn('px-3 py-1 rounded-full text-xs font-medium border', config.color)}>
                {config.label}
            </Badge>
        );
    };

    // Get source badge
    const getSourceBadge = (source: string) => {
        // Normalize source to handle any case variations
        const normalizedSource = source?.toLowerCase() || 'unknown';
        
        const sourceConfig: Record<string, { color: string, label: string }> = {
            'website': { color: 'bg-indigo-100 text-indigo-800 border-indigo-200', label: 'Website' },
            'direct_call': { color: 'bg-teal-100 text-teal-800 border-teal-200', label: 'Direct Call' },
            'referral': { color: 'bg-emerald-100 text-emerald-800 border-emerald-200', label: 'Referral' },
            'social_media': { color: 'bg-sky-100 text-sky-800 border-sky-200', label: 'Social Media' },
            'ai_agent': { color: 'bg-purple-100 text-purple-800 border-purple-200', label: 'AI Agent' },
            'other': { color: 'bg-gray-100 text-gray-800 border-gray-200', label: 'Other' }
        };

        const config = sourceConfig[normalizedSource] || { color: 'bg-gray-100 text-gray-800 border-gray-200', label: 'Unknown' };

        return (
            <Badge variant="outline" className={cn('px-3 py-1 rounded-full text-xs font-medium border', config.color)}>
                {config.label}
            </Badge>
        );
    };

    // Get initials for avatar
    const getInitials = (name: string) => {
        const nameParts = name.split(' ');
        if (nameParts.length === 1) return name.substring(0, 2).toUpperCase();
        return (nameParts[0][0] + nameParts[1][0]).toUpperCase();
    };

    // Handle status change
    const handleStatusChange = async (status: SupabaseLead['status']) => {
        if (!lead) return;

        try {
            await onStatusChange(lead, status);
        } catch (error) {
            console.error('Error changing lead status:', error);
            toast.error('Failed to update lead status');
        }
    };

    // Handle add note
    const handleAddNote = async () => {
        if (!lead || !newNote.trim()) return;

        setIsAddingNote(true);
        try {
            await onAddNote(lead, newNote);
            setNewNote('');
            toast.success('Note added successfully');
        } catch (error) {
            console.error('Error adding note:', error);
            toast.error('Failed to add note');
        } finally {
            setIsAddingNote(false);
        }
    };

    // Format notes for display
    const formatNotes = (notes?: string) => {
        if (!notes) return [];

        return notes.split('\n').filter(note => note.trim() !== '');
    };
    
    // Store a reference to track if we've processed custom data
    const processedLeadId = React.useRef<string | null>(null);
    
    // Process custom lead data and add to notes when component mounts
    useEffect(() => {
        // Skip if we've already processed this lead or if there's no lead
        if (!lead || !lead.id || processedLeadId.current === lead.id || isAddingNote || !lead.custom_lead_data) {
            return;
        }
        
        // Mark this lead as processed
        processedLeadId.current = lead.id;
        
        // Use a timeout to ensure we don't interfere with other state updates
        const timer = setTimeout(() => {
            try {
                // Check if the custom data is valid JSON or already a parsed object
                let customData = lead.custom_lead_data;
                if (typeof customData === 'string') {
                    try {
                        customData = JSON.parse(customData);
                    } catch (e) {
                        // If it's not valid JSON, just use it as is
                        console.log('Custom lead data is not valid JSON, using as string');
                    }
                }
                
                // Only process if we have valid data
                if (customData && typeof customData === 'object') {
                    // Format custom lead data
                    const customDataFormatted = formatCustomLeadData(customData);
                    
                    // Check if custom data is already in notes to avoid duplication
                    if (customDataFormatted && 
                        lead.notes && 
                        !lead.notes.includes('--- Custom Lead Data ---')) {
                        const combinedNotes = combineNotesWithCustomData(lead.notes, customData);
                        onAddNote(lead, combinedNotes).catch(err => 
                            console.error('Error adding combined notes:', err)
                        );
                    } else if (customDataFormatted && !lead.notes) {
                        // If no notes exist yet, just add the custom data
                        onAddNote(lead, customDataFormatted).catch(err => 
                            console.error('Error adding custom data as notes:', err)
                        );
                    }
                }
            } catch (error) {
                console.error('Error processing custom lead data:', error);
            }
        }, 1000); // Longer delay to ensure component is fully mounted
        
        // Cleanup function
        return () => {
            clearTimeout(timer);
        };
    }, [lead?.id]); // Only depend on lead ID to prevent unnecessary re-runs

    if (!isOpen || !lead) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex justify-between items-center">
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            <User className="h-5 w-5" />
                            Lead Details
                        </DialogTitle>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onClose}
                            className="h-8 w-8 p-0"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                    <DialogDescription>
                        View and manage lead information
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid grid-cols-2">
                        <TabsTrigger value="details">
                            <FileText className="h-4 w-4 mr-2" />
                            Details
                        </TabsTrigger>
                        <TabsTrigger value="notes">
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Notes
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="details" className="mt-4">
                        <div className="space-y-6">
                            {/* Lead Header */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <Avatar className="h-16 w-16">
                                        <AvatarFallback>{getInitials(lead.full_name)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <h2 className="text-xl font-bold">{lead.full_name}</h2>
                                        <div className="flex items-center gap-2 mt-1">
                                            <div>{getStatusBadge(lead.status)}</div>
                                            <div>{getSourceBadge(lead.source)}</div>
                                        </div>
                                    </div>
                                </div>
                                <Button variant="outline" size="sm">
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit Lead
                                </Button>
                            </div>

                            <Separator />

                            {/* Lead Information */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Contact Information */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base">Contact Information</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <Phone className="h-5 w-5 text-muted-foreground" />
                                            <div>
                                                <p className="text-sm text-muted-foreground">Phone Number</p>
                                                <p className="font-medium">{lead.phone_number}</p>
                                            </div>
                                        </div>

                                        {/* Add dialed from phone number field */}
                                        <div className="flex items-center gap-3">
                                            <PhoneCall className="h-5 w-5 text-muted-foreground" />
                                            <div>
                                                <p className="text-sm text-muted-foreground">Dialed From</p>
                                                <p className="font-medium">{lead.from_phone_number || 'Not available'}</p>
                                            </div>
                                        </div>

                                        {/* Hide email for now as requested */}
                                        {/* <div className="flex items-center gap-3">
                                            <Mail className="h-5 w-5 text-muted-foreground" />
                                            <div>
                                                <p className="text-sm text-muted-foreground">Email</p>
                                                <p className="font-medium">{lead.email || 'Not provided'}</p>
                                            </div>
                                        </div> */}

                                        <div className="flex items-center gap-3">
                                            <Calendar className="h-5 w-5 text-muted-foreground" />
                                            <div>
                                                <p className="text-sm text-muted-foreground">Created Date</p>
                                                <p className="font-medium">
                                                    {lead.created_at && !isNaN(new Date(lead.created_at).getTime())
                                                        ? format(new Date(lead.created_at), 'MMMM d, yyyy')
                                                        : 'Invalid date'}
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Lead Details */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base">Lead Details</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <ExternalLink className="h-5 w-5 text-muted-foreground" />
                                            <div>
                                                <p className="text-sm text-muted-foreground">Source</p>
                                                <p className="font-medium">
                                                    {lead.source === 'direct_call' ? 'Direct Call' :
                                                        lead.source === 'website' ? 'Website' :
                                                            lead.source === 'referral' ? 'Referral' :
                                                                lead.source === 'social_media' ? 'Social Media' :
                                                                    lead.source === 'ai_agent' ? 'AI Agent' :
                                                                        'Other'}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Show call time instead of call ID for client view */}
                                        <div className="flex items-center gap-3">
                                            <PhoneCall className="h-5 w-5 text-muted-foreground" />
                                            <div>
                                                <p className="text-sm text-muted-foreground">Call Time</p>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-medium">{lead.call_time || 'Not available'}</p>
                                                    {lead.call_id && canViewSensitiveInfo(user) && (
                                                        <Button 
                                                            variant="ghost" 
                                                            size="sm" 
                                                            className="h-7 px-2 text-primary"
                                                            asChild
                                                        >
                                                            <a href={`/logs?callId=${lead.call_id}`} target="_blank" rel="noopener noreferrer">
                                                                <Link className="h-3.5 w-3.5 mr-1" />
                                                                View Call
                                                            </a>
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Only show client information to admins */}
                                        {canViewSensitiveInfo(user) && (
                                            <div className="flex items-center gap-3">
                                                <User className="h-5 w-5 text-muted-foreground" />
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Client</p>
                                                    <p className="font-medium">{lead.client_name || clientName || 'Unknown'}</p>
                                                </div>
                                            </div>
                                        )}
                                        
                                        {/* Add Sent To field */}
                                        {lead.sent_to && (
                                            <div className="flex items-center gap-3">
                                                <Mail className="h-5 w-5 text-muted-foreground" />
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Sent To</p>
                                                    <p className="font-medium">{lead.sent_to}</p>
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Status Management */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Status Management</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <Clock className="h-5 w-5 text-muted-foreground" />
                                            <div>
                                                <p className="text-sm text-muted-foreground">Current Status</p>
                                                <div className="mt-1">{getStatusBadge(lead.status)}</div>
                                            </div>
                                        </div>

                                        <Separator />

                                        <div>
                                            <p className="text-sm text-muted-foreground mb-3">Update Status</p>
                                            <div className="flex flex-wrap gap-2">
                                                {lead.status !== 'new' && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleStatusChange('new')}
                                                    >
                                                        Set as New
                                                    </Button>
                                                )}
                                                {lead.status !== 'contacted' && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleStatusChange('contacted')}
                                                    >
                                                        Set as Contacted
                                                    </Button>
                                                )}
                                                {lead.status !== 'qualified' && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleStatusChange('qualified')}
                                                    >
                                                        Set as Qualified
                                                    </Button>
                                                )}
                                                {lead.status !== 'proposal' && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleStatusChange('proposal')}
                                                    >
                                                        Set as Proposal
                                                    </Button>
                                                )}
                                                {lead.status !== 'closed_won' && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="text-green-600"
                                                        onClick={() => handleStatusChange('closed_won')}
                                                    >
                                                        Set as Closed (Won)
                                                    </Button>
                                                )}
                                                {lead.status !== 'closed_lost' && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="text-red-600"
                                                        onClick={() => handleStatusChange('closed_lost')}
                                                    >
                                                        Set as Closed (Lost)
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="notes" className="mt-4">
                        <div className="space-y-6">
                            {/* Add Note */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Add Note</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <Textarea
                                            placeholder="Enter a note about this lead..."
                                            value={newNote}
                                            onChange={(e) => setNewNote(e.target.value)}
                                            rows={3}
                                        />
                                        <Button
                                            onClick={handleAddNote}
                                            disabled={!newNote.trim() || isAddingNote}
                                        >
                                            <Save className="h-4 w-4 mr-2" />
                                            {isAddingNote ? 'Adding...' : 'Add Note'}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Notes List */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Notes History</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {formatNotes(lead.notes).length > 0 ? (
                                        <div className="space-y-4">
                                            {formatNotes(lead.notes).map((note, index) => (
                                                <div key={index} className="p-4 bg-secondary/30 rounded-lg">
                                                    <p className="text-sm">{note}</p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-6">
                                            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground opacity-20 mb-2" />
                                            <p className="text-muted-foreground">No notes yet</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                </Tabs>

                <DialogFooter className="mt-4">
                    <Button variant="outline" onClick={onClose}>
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default LeadDetailsView;