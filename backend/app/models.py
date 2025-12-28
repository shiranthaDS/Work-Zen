from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
from datetime import datetime, date
from enum import Enum

# Enums
class Gender(str, Enum):
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"

class MaritalStatus(str, Enum):
    SINGLE = "single"
    MARRIED = "married"
    DIVORCED = "divorced"
    WIDOWED = "widowed"

class EmploymentStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    TERMINATED = "terminated"
    ON_LEAVE = "on_leave"
    PROBATION = "probation"

class EmploymentType(str, Enum):
    FULL_TIME = "full_time"
    PART_TIME = "part_time"
    CONTRACT = "contract"
    INTERN = "intern"
    TEMPORARY = "temporary"

class AttendanceStatus(str, Enum):
    PRESENT = "present"
    ABSENT = "absent"
    LATE = "late"
    HALF_DAY = "half_day"
    WORK_FROM_HOME = "work_from_home"

class LeaveType(str, Enum):
    ANNUAL = "annual"
    SICK = "sick"
    MATERNITY = "maternity"
    PATERNITY = "paternity"
    UNPAID = "unpaid"
    COMPENSATORY = "compensatory"
    BEREAVEMENT = "bereavement"

class LeaveStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    CANCELLED = "cancelled"

class PaymentStatus(str, Enum):
    PENDING = "pending"
    PROCESSED = "processed"
    PAID = "paid"
    FAILED = "failed"

# ============== EMPLOYEE CORE DATA ==============
class EmergencyContact(BaseModel):
    name: str
    relationship: str
    phone: str
    email: Optional[str] = None

class Address(BaseModel):
    street: str
    city: str
    state: str
    postal_code: str
    country: str

class EmployeeBase(BaseModel):
    # Personal Information
    employee_id: str
    first_name: str
    last_name: str
    email: EmailStr
    phone: str
    date_of_birth: str
    gender: Gender
    marital_status: MaritalStatus
    nationality: str
    
    # Address
    address: Address
    
    # Emergency Contact
    emergency_contact: EmergencyContact
    
    # Employment Info
    hire_date: str
    employment_status: EmploymentStatus = EmploymentStatus.ACTIVE
    employment_type: EmploymentType = EmploymentType.FULL_TIME
    
    # Documents
    national_id: Optional[str] = None
    passport_number: Optional[str] = None
    driving_license: Optional[str] = None
    
    # Profile
    profile_picture: Optional[str] = None
    blood_group: Optional[str] = None

class EmployeeCreate(EmployeeBase):
    pass

class EmployeeUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    date_of_birth: Optional[str] = None
    gender: Optional[Gender] = None
    marital_status: Optional[MaritalStatus] = None
    nationality: Optional[str] = None
    address: Optional[Address] = None
    emergency_contact: Optional[EmergencyContact] = None
    hire_date: Optional[str] = None
    employment_status: Optional[EmploymentStatus] = None
    employment_type: Optional[EmploymentType] = None
    national_id: Optional[str] = None
    passport_number: Optional[str] = None
    driving_license: Optional[str] = None
    profile_picture: Optional[str] = None
    blood_group: Optional[str] = None

class EmployeeResponse(EmployeeBase):
    id: str = Field(alias="_id")
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        populate_by_name = True


# ============== JOB & ORGANIZATIONAL DATA ==============
class JobDataBase(BaseModel):
    employee_id: str
    
    # Job Information
    job_title: str
    job_description: Optional[str] = None
    department: str
    division: Optional[str] = None
    team: Optional[str] = None
    
    # Organizational
    reporting_manager: Optional[str] = None
    manager_id: Optional[str] = None
    work_location: str
    work_shift: Optional[str] = "day"
    
    # Position Details
    grade_level: Optional[str] = None
    job_category: Optional[str] = None
    cost_center: Optional[str] = None
    
    # Dates
    position_start_date: str
    position_end_date: Optional[str] = None
    probation_end_date: Optional[str] = None
    
    # Skills & Qualifications
    skills: Optional[List[str]] = []
    certifications: Optional[List[str]] = []
    education: Optional[str] = None
    experience_years: Optional[int] = None

class JobDataCreate(JobDataBase):
    pass

class JobDataUpdate(BaseModel):
    job_title: Optional[str] = None
    job_description: Optional[str] = None
    department: Optional[str] = None
    division: Optional[str] = None
    team: Optional[str] = None
    reporting_manager: Optional[str] = None
    manager_id: Optional[str] = None
    work_location: Optional[str] = None
    work_shift: Optional[str] = None
    grade_level: Optional[str] = None
    job_category: Optional[str] = None
    cost_center: Optional[str] = None
    position_start_date: Optional[str] = None
    position_end_date: Optional[str] = None
    probation_end_date: Optional[str] = None
    skills: Optional[List[str]] = None
    certifications: Optional[List[str]] = None
    education: Optional[str] = None
    experience_years: Optional[int] = None

class JobDataResponse(JobDataBase):
    id: str = Field(alias="_id")
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        populate_by_name = True


# ============== ATTENDANCE ==============
class AttendanceBase(BaseModel):
    employee_id: str
    date: str
    status: AttendanceStatus
    
    # Time Tracking
    check_in_time: Optional[str] = None
    check_out_time: Optional[str] = None
    break_duration: Optional[int] = 0  # in minutes
    
    # Working Hours
    total_hours: Optional[float] = 0
    overtime_hours: Optional[float] = 0
    
    # Location
    work_location: Optional[str] = None
    ip_address: Optional[str] = None
    
    # Notes
    notes: Optional[str] = None
    approved_by: Optional[str] = None

class AttendanceCreate(AttendanceBase):
    pass

class AttendanceUpdate(BaseModel):
    status: Optional[AttendanceStatus] = None
    check_in_time: Optional[str] = None
    check_out_time: Optional[str] = None
    break_duration: Optional[int] = None
    total_hours: Optional[float] = None
    overtime_hours: Optional[float] = None
    work_location: Optional[str] = None
    notes: Optional[str] = None
    approved_by: Optional[str] = None

class AttendanceResponse(AttendanceBase):
    id: str = Field(alias="_id")
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        populate_by_name = True


# ============== LEAVE MANAGEMENT ==============
class LeaveBase(BaseModel):
    employee_id: str
    leave_type: LeaveType
    
    # Leave Period
    start_date: str
    end_date: str
    total_days: float
    
    # Status
    status: LeaveStatus = LeaveStatus.PENDING
    
    # Details
    reason: str
    supporting_document: Optional[str] = None
    
    # Approval
    approved_by: Optional[str] = None
    approval_date: Optional[str] = None
    rejection_reason: Optional[str] = None
    
    # Contact during leave
    emergency_contact_during_leave: Optional[str] = None

class LeaveCreate(LeaveBase):
    pass

class LeaveUpdate(BaseModel):
    leave_type: Optional[LeaveType] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    total_days: Optional[float] = None
    status: Optional[LeaveStatus] = None
    reason: Optional[str] = None
    supporting_document: Optional[str] = None
    approved_by: Optional[str] = None
    approval_date: Optional[str] = None
    rejection_reason: Optional[str] = None

class LeaveResponse(LeaveBase):
    id: str = Field(alias="_id")
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        populate_by_name = True


# ============== LEAVE BALANCE ==============
class LeaveBalanceBase(BaseModel):
    employee_id: str
    year: int
    
    # Leave Quotas
    annual_leave_total: float = 21
    annual_leave_used: float = 0
    annual_leave_balance: float = 21
    
    sick_leave_total: float = 14
    sick_leave_used: float = 0
    sick_leave_balance: float = 14
    
    maternity_leave_total: float = 84
    maternity_leave_used: float = 0
    maternity_leave_balance: float = 84
    
    paternity_leave_total: float = 14
    paternity_leave_used: float = 0
    paternity_leave_balance: float = 14
    
    unpaid_leave_used: float = 0
    compensatory_leave_balance: float = 0
    
    # Carry Forward
    carry_forward_days: float = 0

class LeaveBalanceCreate(LeaveBalanceBase):
    pass

class LeaveBalanceUpdate(BaseModel):
    annual_leave_used: Optional[float] = None
    annual_leave_balance: Optional[float] = None
    sick_leave_used: Optional[float] = None
    sick_leave_balance: Optional[float] = None
    maternity_leave_used: Optional[float] = None
    maternity_leave_balance: Optional[float] = None
    paternity_leave_used: Optional[float] = None
    paternity_leave_balance: Optional[float] = None
    unpaid_leave_used: Optional[float] = None
    compensatory_leave_balance: Optional[float] = None
    carry_forward_days: Optional[float] = None

class LeaveBalanceResponse(LeaveBalanceBase):
    id: str = Field(alias="_id")
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        populate_by_name = True


# ============== SALARY STRUCTURE ==============
class SalaryStructureBase(BaseModel):
    employee_id: str
    effective_date: str
    
    # Basic Salary
    basic_salary: float
    currency: str = "USD"
    
    # Allowances
    housing_allowance: float = 0
    transport_allowance: float = 0
    meal_allowance: float = 0
    phone_allowance: float = 0
    medical_allowance: float = 0
    other_allowances: float = 0
    
    # Deductions
    tax_deduction: float = 0
    insurance_deduction: float = 0
    pension_deduction: float = 0
    loan_deduction: float = 0
    other_deductions: float = 0
    
    # Totals
    gross_salary: float
    total_deductions: float
    net_salary: float
    
    # Bank Details
    bank_name: Optional[str] = None
    bank_account_number: Optional[str] = None
    bank_branch: Optional[str] = None
    payment_method: str = "bank_transfer"
    
    # Status
    is_active: bool = True

class SalaryStructureCreate(SalaryStructureBase):
    pass

class SalaryStructureUpdate(BaseModel):
    effective_date: Optional[str] = None
    basic_salary: Optional[float] = None
    currency: Optional[str] = None
    housing_allowance: Optional[float] = None
    transport_allowance: Optional[float] = None
    meal_allowance: Optional[float] = None
    phone_allowance: Optional[float] = None
    medical_allowance: Optional[float] = None
    other_allowances: Optional[float] = None
    tax_deduction: Optional[float] = None
    insurance_deduction: Optional[float] = None
    pension_deduction: Optional[float] = None
    loan_deduction: Optional[float] = None
    other_deductions: Optional[float] = None
    gross_salary: Optional[float] = None
    total_deductions: Optional[float] = None
    net_salary: Optional[float] = None
    bank_name: Optional[str] = None
    bank_account_number: Optional[str] = None
    bank_branch: Optional[str] = None
    payment_method: Optional[str] = None
    is_active: Optional[bool] = None

class SalaryStructureResponse(SalaryStructureBase):
    id: str = Field(alias="_id")
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        populate_by_name = True


# ============== PAYROLL ==============
class PayrollBase(BaseModel):
    employee_id: str
    pay_period_start: str
    pay_period_end: str
    payment_date: str
    
    # Earnings
    basic_salary: float
    overtime_pay: float = 0
    bonus: float = 0
    commission: float = 0
    allowances_total: float = 0
    
    # Deductions
    tax: float = 0
    insurance: float = 0
    pension: float = 0
    loan_repayment: float = 0
    other_deductions: float = 0
    
    # Totals
    gross_pay: float
    total_deductions: float
    net_pay: float
    
    # Status
    status: PaymentStatus = PaymentStatus.PENDING
    
    # Transaction Details
    transaction_id: Optional[str] = None
    payment_method: str = "bank_transfer"
    
    # Notes
    notes: Optional[str] = None
    processed_by: Optional[str] = None

class PayrollCreate(PayrollBase):
    pass

class PayrollUpdate(BaseModel):
    pay_period_start: Optional[str] = None
    pay_period_end: Optional[str] = None
    payment_date: Optional[str] = None
    basic_salary: Optional[float] = None
    overtime_pay: Optional[float] = None
    bonus: Optional[float] = None
    commission: Optional[float] = None
    allowances_total: Optional[float] = None
    tax: Optional[float] = None
    insurance: Optional[float] = None
    pension: Optional[float] = None
    loan_repayment: Optional[float] = None
    other_deductions: Optional[float] = None
    gross_pay: Optional[float] = None
    total_deductions: Optional[float] = None
    net_pay: Optional[float] = None
    status: Optional[PaymentStatus] = None
    transaction_id: Optional[str] = None
    payment_method: Optional[str] = None
    notes: Optional[str] = None
    processed_by: Optional[str] = None

class PayrollResponse(PayrollBase):
    id: str = Field(alias="_id")
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        populate_by_name = True
