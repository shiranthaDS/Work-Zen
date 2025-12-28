'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiArrowLeft, FiSave, FiPlus, FiX } from 'react-icons/fi';
import { jobDataApi } from '@/lib/api';
import toast from 'react-hot-toast';

export default function AddJobDataPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    employee_id: '',
    job_title: '',
    job_description: '',
    department: '',
    division: '',
    team: '',
    reporting_manager: '',
    manager_id: '',
    work_location: '',
    work_shift: 'day',
    grade_level: '',
    job_category: '',
    cost_center: '',
    position_start_date: '',
    position_end_date: '',
    probation_end_date: '',
    skills: [] as string[],
    certifications: [] as string[],
    education: '',
    experience_years: 0,
  });
  const [newSkill, setNewSkill] = useState('');
  const [newCertification, setNewCertification] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'experience_years' ? parseInt(value) || 0 : value
    }));
  };

  const addSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()]
      }));
      setNewSkill('');
    }
  };

  const removeSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill)
    }));
  };

  const addCertification = () => {
    if (newCertification.trim() && !formData.certifications.includes(newCertification.trim())) {
      setFormData(prev => ({
        ...prev,
        certifications: [...prev.certifications, newCertification.trim()]
      }));
      setNewCertification('');
    }
  };

  const removeCertification = (cert: string) => {
    setFormData(prev => ({
      ...prev,
      certifications: prev.certifications.filter(c => c !== cert)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await jobDataApi.create(formData);
      toast.success('Job data created successfully');
      router.push('/job-data');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to create job data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/job-data" className="p-2 hover:bg-gray-100 rounded-lg">
          <FiArrowLeft size={24} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Add Job Data</h1>
          <p className="text-gray-500">Fill in the job and organizational details</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Job Information */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Job Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID *</label>
              <input
                type="text"
                name="employee_id"
                value={formData.employee_id}
                onChange={handleChange}
                required
                className="input-field"
                placeholder="EMP001"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Job Title *</label>
              <input
                type="text"
                name="job_title"
                value={formData.job_title}
                onChange={handleChange}
                required
                className="input-field"
                placeholder="Software Engineer"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleChange}
                required
                className="input-field"
                placeholder="Engineering"
              />
            </div>
            <div className="lg:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Job Description</label>
              <textarea
                name="job_description"
                value={formData.job_description}
                onChange={handleChange}
                rows={3}
                className="input-field"
                placeholder="Describe the job responsibilities..."
              />
            </div>
          </div>
        </div>

        {/* Organizational Structure */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Organizational Structure</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Division</label>
              <input
                type="text"
                name="division"
                value={formData.division}
                onChange={handleChange}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Team</label>
              <input
                type="text"
                name="team"
                value={formData.team}
                onChange={handleChange}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reporting Manager</label>
              <input
                type="text"
                name="reporting_manager"
                value={formData.reporting_manager}
                onChange={handleChange}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Manager ID</label>
              <input
                type="text"
                name="manager_id"
                value={formData.manager_id}
                onChange={handleChange}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Work Location *</label>
              <input
                type="text"
                name="work_location"
                value={formData.work_location}
                onChange={handleChange}
                required
                className="input-field"
                placeholder="New York Office"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Work Shift</label>
              <select name="work_shift" value={formData.work_shift} onChange={handleChange} className="input-field">
                <option value="day">Day</option>
                <option value="night">Night</option>
                <option value="rotating">Rotating</option>
                <option value="flexible">Flexible</option>
              </select>
            </div>
          </div>
        </div>

        {/* Position Details */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Position Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Grade Level</label>
              <input
                type="text"
                name="grade_level"
                value={formData.grade_level}
                onChange={handleChange}
                className="input-field"
                placeholder="L3"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Job Category</label>
              <input
                type="text"
                name="job_category"
                value={formData.job_category}
                onChange={handleChange}
                className="input-field"
                placeholder="Technical"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cost Center</label>
              <input
                type="text"
                name="cost_center"
                value={formData.cost_center}
                onChange={handleChange}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Position Start Date *</label>
              <input
                type="date"
                name="position_start_date"
                value={formData.position_start_date}
                onChange={handleChange}
                required
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Position End Date</label>
              <input
                type="date"
                name="position_end_date"
                value={formData.position_end_date}
                onChange={handleChange}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Probation End Date</label>
              <input
                type="date"
                name="probation_end_date"
                value={formData.probation_end_date}
                onChange={handleChange}
                className="input-field"
              />
            </div>
          </div>
        </div>

        {/* Skills & Qualifications */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Skills & Qualifications</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Skills */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Skills</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                  className="input-field flex-1"
                  placeholder="Add a skill"
                />
                <button type="button" onClick={addSkill} className="btn-secondary">
                  <FiPlus />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.skills.map((skill) => (
                  <span key={skill} className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    {skill}
                    <button type="button" onClick={() => removeSkill(skill)} className="hover:text-blue-600">
                      <FiX size={14} />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Certifications */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Certifications</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newCertification}
                  onChange={(e) => setNewCertification(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCertification())}
                  className="input-field flex-1"
                  placeholder="Add a certification"
                />
                <button type="button" onClick={addCertification} className="btn-secondary">
                  <FiPlus />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.certifications.map((cert) => (
                  <span key={cert} className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                    {cert}
                    <button type="button" onClick={() => removeCertification(cert)} className="hover:text-green-600">
                      <FiX size={14} />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Education</label>
              <input
                type="text"
                name="education"
                value={formData.education}
                onChange={handleChange}
                className="input-field"
                placeholder="Bachelor's in Computer Science"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Experience (Years)</label>
              <input
                type="number"
                name="experience_years"
                value={formData.experience_years}
                onChange={handleChange}
                min="0"
                className="input-field"
              />
            </div>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end gap-4">
          <Link href="/job-data" className="btn-secondary">
            Cancel
          </Link>
          <button type="submit" disabled={loading} className="btn-primary inline-flex items-center gap-2">
            <FiSave size={20} />
            {loading ? 'Saving...' : 'Save Job Data'}
          </button>
        </div>
      </form>
    </div>
  );
}
