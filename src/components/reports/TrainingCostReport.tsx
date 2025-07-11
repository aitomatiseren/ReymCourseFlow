
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Download, Filter, Search, Calendar, Users, Loader2 } from "lucide-react";
import { useTrainings } from "@/hooks/useTrainings";

export function TrainingCostReport() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  const { data: trainings = [], isLoading, error } = useTrainings();

  const getStatusBadge = (status: string) => {
    const statusColors = {
      scheduled: "bg-blue-100 text-blue-800",
      confirmed: "bg-green-100 text-green-800", 
      completed: "bg-gray-100 text-gray-800",
      cancelled: "bg-red-100 text-red-800"
    };
    
    return (
      <Badge className={statusColors[status as keyof typeof statusColors] || "bg-gray-100 text-gray-800"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const calculateTotalCost = (training: any) => {
    const basePrice = training.price || 0;
    const participantCost = basePrice * training.participantCount;
    return participantCost;
  };

  const filteredTrainings = trainings
    .filter(training => {
      const matchesSearch = training.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           training.instructor.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           training.location.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || training.status === statusFilter;
      
      let matchesDate = true;
      if (dateFilter !== "all") {
        const trainingDate = new Date(training.date);
        const now = new Date();
        const currentYear = now.getFullYear();
        
        switch (dateFilter) {
          case "thisMonth":
            matchesDate = trainingDate.getMonth() === now.getMonth() && 
                         trainingDate.getFullYear() === currentYear;
            break;
          case "thisQuarter":
            const currentQuarter = Math.floor(now.getMonth() / 3);
            const trainingQuarter = Math.floor(trainingDate.getMonth() / 3);
            matchesDate = trainingQuarter === currentQuarter && 
                         trainingDate.getFullYear() === currentYear;
            break;
          case "thisYear":
            matchesDate = trainingDate.getFullYear() === currentYear;
            break;
        }
      }
      
      return matchesSearch && matchesStatus && matchesDate;
    });

  const totalCost = filteredTrainings.reduce((sum, training) => sum + calculateTotalCost(training), 0);
  const totalParticipants = filteredTrainings.reduce((sum, training) => sum + training.participantCount, 0);

  const handleExport = () => {
    console.log("Exporting training cost report...");
    // TODO: Implement CSV/Excel export
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading training data...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-red-500">Error loading training data: {error.message}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Training Cost Report
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Track training expenses and budget utilization
            </p>
          </div>
          <Button onClick={handleExport} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Cost</p>
                  <p className="text-2xl font-bold">€{totalCost.toLocaleString()}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Trainings</p>
                  <p className="text-2xl font-bold">{filteredTrainings.length}</p>
                </div>
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Participants</p>
                  <p className="text-2xl font-bold">{totalParticipants}</p>
                </div>
                <Users className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search trainings, instructors, or locations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Dates</SelectItem>
              <SelectItem value="thisMonth">This Month</SelectItem>
              <SelectItem value="thisQuarter">This Quarter</SelectItem>
              <SelectItem value="thisYear">This Year</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Trainings Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Training</TableHead>
                <TableHead>Instructor</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Participants</TableHead>
                <TableHead>Cost per Person</TableHead>
                <TableHead>Total Cost</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTrainings.map((training) => (
                <TableRow key={training.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{training.title}</div>
                      {training.courseName && (
                        <div className="text-sm text-muted-foreground">{training.courseName}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{training.instructor}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {new Date(training.date).toLocaleDateString('nl-NL')}
                    </div>
                  </TableCell>
                  <TableCell>{training.location}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      {training.participantCount}/{training.maxParticipants}
                    </div>
                  </TableCell>
                  <TableCell>
                    {training.price ? `€${training.price.toLocaleString()}` : 'Free'}
                  </TableCell>
                  <TableCell className="font-medium">
                    €{calculateTotalCost(training).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(training.status)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredTrainings.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No trainings found matching your filters.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
