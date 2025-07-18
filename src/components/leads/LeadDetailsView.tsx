import React, { useState } from 'react';
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
import { Lead } from '@/context/LeadContext';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface LeadDetailsViewProps {
    lead: Lead | null;
    isOpen: boolean;
    onClose: () => void;
    onStatusChange: (lead: Lead, status: Lead['status']) => Promise<void>;
    onAddNote: (lead: Lead, note: string) => Promise<void>;
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
    const getStatusBadge = (status: Lead['status']) => {
        const statusConfig: Record<Lead['status'], { color: string, label: string }> = {
            new: { color: 'bg-blue-100 text-blue-800 border-blue-200', label: 'New' },
            contacted: { color: 'bg-purple-100 text-purple-800 border-purple-200', label: 'Contacted' },
            qualified: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', label: 'Qualified' },
            proposal: { color: 'bg-orange-100 text-orange-800 border-orange-200', label: 'Proposal' },
            closed_won: { color: 'bg-green-100 text-green-800 border-green-200', label: 'Closed (Won)' },
            closed_lost: { color: 'bg-red-100 text-red-800 border-red-200', label: 'Closed (Lost)' }
        };

        const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800 border-gray-200', label: 'Unknown' };

        return (
            <Badge className={cn('px-3 py-1 rounded-full text-xs font-medium border', config.color)}>
                {config.label}
            </Badge>
        );
    };

    // Get source badge
    const getSourceBadge = (source: Lead['source']) => {
        const sourceConfig: Record<Lead['source'], { color: string, label: string }> = {
            website: { color: 'bg-indigo-100 text-indigo-800 border-indigo-200', label: 'Website' },
            direct_call: { color: 'bg-teal-100 text-teal-800 border-teal-200', label: 'Direct Call' },
            referral: { color: 'bg-emerald-100 text-emerald-800 border-emerald-200', label: 'Referral' },
            social_media: { color: 'bg-sky-100 text-sky-800 border-sky-200', label: 'Social Media' },
            other: { color: 'bg-gray-100 text-gray-800 border-gray-200', label: 'Other' }
        };

        const config = sourceConfig[source] || { color: 'bg-gray-100 text-gray-800 border-gray-200', label: 'Unknown' };

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
    const handleStatusChange = async (status: Lead['status']) => {
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
                                        <AvatarFallback>{getInitials(lead.fullName)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <h2 className="text-xl font-bold">{lead.fullName}</h2>
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
                                                <p className="font-medium">{lead.phoneNumber}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <Mail className="h-5 w-5 text-muted-foreground" />
                                            <div>
                                                <p className="text-sm text-muted-foreground">Email</p>
                                                <p className="font-medium">{lead.email || 'Not provided'}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <Calendar className="h-5 w-5 text-muted-foreground" />
                                            <div>
                                                <p className="text-sm text-muted-foreground">Created Date</p>
                                                <p className="font-medium">
                                                    {format(new Date(lead.createdAt), 'MMMM d, yyyy')}
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
                                                                    'Other'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <PhoneCall className="h-5 w-5 text-muted-foreground" />
                                            <div>
                                                <p className="text-sm text-muted-foreground">Call ID</p>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-medium">{lead.callId}</p>
                                                    {lead.callId && (
                                                        <Button 
                                                            variant="ghost" 
                                                            size="sm" 
                                                            className="h-7 px-2 text-primary"
                                                            asChild
                                                        >
                                                            <a href={`/logs?callId=${lead.callId}`} target="_blank" rel="noopener noreferrer">
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
                                                    <p className="font-medium">{clientName || lead.clientId || 'N/A'}</p>
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