
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Calendar, Download, Filter, Search, AlertTriangle, Clock, CheckCircle, Loader2 } from "lucide-react";
import { useCertificates } from "@/hooks/useCertificates";

export function CertificateExpiryReport() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("expiry");

  const { data: certificates = [], isLoading, error } = useCertificates();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "expired":
        return <Badge variant="destructive" className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          Expired
        </Badge>;
      case "expiring":
        return <Badge variant="secondary" className="flex items-center gap-1 bg-orange-100 text-orange-800">
          <Clock className="h-3 w-3" />
          Expiring Soon
        </Badge>;
      case "valid":
        return <Badge variant="secondary" className="flex items-center gap-1 bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3" />
          Valid
        </Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getDaysUntilExpiry = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const filteredCertificates = certificates
    .filter(cert => {
      const matchesSearch = cert.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           cert.licenseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           cert.certificateNumber.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || cert.status === statusFilter;
      const matchesCategory = categoryFilter === "all" || cert.category === categoryFilter;
      return matchesSearch && matchesStatus && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === "expiry") {
        return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
      }
      return a.employeeName.localeCompare(b.employeeName);
    });

  const handleExport = () => {
    console.log("Exporting certificate expiry report...");
    // TODO: Implement CSV/Excel export
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading certificate data...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-red-500">Error loading certificate data: {error.message}</p>
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
              <Calendar className="h-5 w-5" />
              Certificate Expiry Report
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Track certificate expiration dates and renewal requirements
            </p>
          </div>
          <Button onClick={handleExport} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search employees, licenses, or certificate numbers..."
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
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="expiring">Expiring Soon</SelectItem>
              <SelectItem value="valid">Valid</SelectItem>
            </SelectContent>
          </Select>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="Safety">Safety</SelectItem>
              <SelectItem value="Equipment">Equipment</SelectItem>
              <SelectItem value="Technical">Technical</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="expiry">Expiry Date</SelectItem>
              <SelectItem value="name">Employee Name</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Results Summary */}
        <div className="flex items-center justify-between text-sm text-muted-foreground border-b pb-2">
          <span>Showing {filteredCertificates.length} certificates</span>
          <span>
            {filteredCertificates.filter(c => c.status === "expired").length} expired, {" "}
            {filteredCertificates.filter(c => c.status === "expiring").length} expiring soon
          </span>
        </div>

        {/* Certificates Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>License/Certificate</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Certificate Number</TableHead>
                <TableHead>Expiry Date</TableHead>
                <TableHead>Days Left</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCertificates.map((cert) => {
                const daysLeft = getDaysUntilExpiry(cert.expiryDate);
                return (
                  <TableRow key={cert.id}>
                    <TableCell className="font-medium">
                      {cert.employeeName}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{cert.licenseName}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{cert.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {cert.certificateNumber}
                      </div>
                    </TableCell>
                    <TableCell>
                      {cert.expiryDate ? new Date(cert.expiryDate).toLocaleDateString('nl-NL') : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <span className={
                        daysLeft < 0 ? "text-red-600 font-semibold" :
                        daysLeft < 30 ? "text-orange-600 font-semibold" :
                        "text-gray-600"
                      }>
                        {daysLeft < 0 ? `${Math.abs(daysLeft)} days overdue` : 
                         daysLeft === 0 ? "Today" :
                         `${daysLeft} days`}
                      </span>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(cert.status)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {filteredCertificates.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No certificates found matching your filters.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
