-- Create certificate exemptions table
CREATE TABLE IF NOT EXISTS certificate_exemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  license_id UUID NOT NULL REFERENCES licenses(id) ON DELETE CASCADE,
  exemption_type VARCHAR(20) NOT NULL CHECK (exemption_type IN ('temporary', 'permanent', 'conditional')),
  reason TEXT NOT NULL,
  justification TEXT,
  effective_date DATE NOT NULL,
  expiry_date DATE,
  approval_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected', 'revoked')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  requested_by_name VARCHAR(255) NOT NULL,
  requested_by_id UUID REFERENCES employees(id),
  approved_by_id UUID REFERENCES employees(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  revocation_reason TEXT,
  revoked_at TIMESTAMP WITH TIME ZONE,
  dont_repeat_flag BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_certificate_exemptions_employee_id ON certificate_exemptions(employee_id);
CREATE INDEX IF NOT EXISTS idx_certificate_exemptions_license_id ON certificate_exemptions(license_id);
CREATE INDEX IF NOT EXISTS idx_certificate_exemptions_approval_status ON certificate_exemptions(approval_status);
CREATE INDEX IF NOT EXISTS idx_certificate_exemptions_effective_date ON certificate_exemptions(effective_date);
CREATE INDEX IF NOT EXISTS idx_certificate_exemptions_expiry_date ON certificate_exemptions(expiry_date);
CREATE INDEX IF NOT EXISTS idx_certificate_exemptions_is_active ON certificate_exemptions(is_active);

-- Create unique constraint to prevent duplicate active exemptions
CREATE UNIQUE INDEX IF NOT EXISTS idx_certificate_exemptions_unique_active 
ON certificate_exemptions(employee_id, license_id) 
WHERE approval_status = 'approved' AND is_active = true;

-- Set up Row Level Security (RLS)
ALTER TABLE certificate_exemptions ENABLE ROW LEVEL SECURITY;

-- Create policies for certificate exemptions
CREATE POLICY "Users can view certificate exemptions" ON certificate_exemptions
  FOR SELECT USING (true);

CREATE POLICY "Users can insert certificate exemptions" ON certificate_exemptions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update certificate exemptions" ON certificate_exemptions
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete certificate exemptions" ON certificate_exemptions
  FOR DELETE USING (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_certificate_exemptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_certificate_exemptions_updated_at_trigger
  BEFORE UPDATE ON certificate_exemptions
  FOR EACH ROW
  EXECUTE FUNCTION update_certificate_exemptions_updated_at();

-- Grant permissions
GRANT ALL ON certificate_exemptions TO authenticated;
GRANT ALL ON certificate_exemptions TO service_role;