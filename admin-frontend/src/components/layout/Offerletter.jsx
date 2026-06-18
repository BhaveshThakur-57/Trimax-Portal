import React, { useState } from 'react';
import { Layers, FileText, User, AlertCircle, Briefcase } from 'lucide-react';

const GenerateOfferLetter = () => {
  const [formData, setFormData] = useState({
    candidateName: '',
    candidateEmail: '',
    candidatePhone: '',
    position: 'Full Stack Web Developer Intern',
    joiningDate: '',
    duration: '6 Months',
    workMode: 'Work from Home / Hybrid',
    department: 'IT Development',
    reportingTo: 'HR Department / Project Manager',
    salaryRange: '₹10,000 – ₹25,000'
  });

  const [isGenerating, setIsGenerating] = useState(false);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleGeneratePDF = async () => {
    // Validation
    if (!formData.candidateName || !formData.candidateEmail || !formData.joiningDate) {
      alert('❌ Please fill all required fields (Name, Email, Joining Date)!');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.candidateEmail)) {
      alert('❌ Please enter a valid email address!');
      return;
    }

    setIsGenerating(true);

    try {
      // Format joining date
      const dateObj = new Date(formData.joiningDate);
      const formattedDate = dateObj.toLocaleDateString('en-GB', { 
        day: '2-digit', 
        month: 'long', 
        year: 'numeric' 
      });

      const fileName = `Offer_Letter_${formData.candidateName.replace(/ /g, '_')}_${new Date().toISOString().split('T')[0].replace(/-/g, '')}.pdf`;

      // Create HTML content for PDF
      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        @page {
            size: A4;
            margin: 0.5in 0.75in;
        }
        body {
            
            font-size: 10pt;
            line-height: 1.4;
            color: #374151;
        }
        .company-header {
            text-align: center;
            margin-bottom: 15px;
        }
        .company-name {
            font-size: 24pt;
            font-weight: bold;
            color: #000;
            margin-bottom: 5px;
        }
        .company-contact {
            font-size: 8pt;
            color: #6b7280;
            text-align: right;
        }
        .to-date-section {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
            font-size: 10pt;
        }
        .title {
            text-align: center;
            font-size: 20pt;
            font-weight: bold;
            color: #1e40af;
            margin: 20px 0;
        }
        .heading {
            font-size: 12pt;
            font-weight: bold;
            color: #1f2937;
            margin-top: 15px;
            margin-bottom: 8px;
        }
        .body-text {
            text-align: justify;
            margin-bottom: 10px;
        }
        ul {
            margin: 5px 0;
            padding-left: 20px;
        }
        li {
            margin-bottom: 4px;
        }
        .signature-section {
            display: flex;
            justify-content: space-between;
            margin-top: 40px;
        }
        .signature-box {
            width: 45%;
        }
        .footer {
            text-align: center;
            color: #1e40af;
            font-size: 9pt;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
        }
        .page-break {
            page-break-after: always;
        }
    </style>
</head>
<body>
    <div class="company-header">
        <div class="company-name">ONE NEST CONNECT<br/>SOFTWARE LIMITED</div>
        <div class="company-contact">
            www.trimaxconnect.com<br/>
            info@trimaxconnect.com
        </div>
    </div>

    <div class="to-date-section">
        <div>
            <strong>To:</strong><br/>
            HR<br/>
            +91 8588942008<br/>
            info@trimaxconnect.com<br/>
            Noida Sector 44., Uttar<br/>
            Pradesh 201301
        </div>
        <div style="text-align: right;">
            <strong>Date:</strong><br/>
            ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
        </div>
    </div>

    <div class="title">OFFER LETTER</div>

    <div class="body-text">
        <strong>Dear ${formData.candidateName},</strong><br/><br/>
        We are delighted to extend this offer for the position of <strong>${formData.position}</strong> at <strong>Trimax Connect Software Pvt. Ltd.</strong><br/><br/>
        <strong>Congratulations on your selection!</strong><br/><br/>
        You have been chosen based on your technical potential, enthusiasm for learning, and alignment with our organizational values. We are confident that this internship will provide you with meaningful industry exposure and professional growth.
    </div>

    <div class="heading">Role & Responsibilities – Human Resource (HR) Department</div>
    <div class="body-text">During the internship, you will be expected to:</div>
    <ul>
        <li>Work on frontend and backend development tasks</li>
        <li>Assist in designing, developing, testing, and maintaining web applications</li>
        <li>Follow coding standards, timelines, and development workflows</li>
        <li>Collaborate with team members and report progress regularly</li>
        <li>Maintain professionalism in communication and deliverables</li>
    </ul>

    <div class="heading">Internship Details</div>
    <ul>
        <li><strong>Position:</strong> ${formData.position}</li>
        <li><strong>Date of Joining:</strong> ${formattedDate}</li>
        <li><strong>Internship Duration:</strong> ${formData.duration}</li>
        <li><strong>Work Mode:</strong> ${formData.workMode}</li>
        <li><strong>Department:</strong> ${formData.department}</li>
        <li><strong>Reporting Authority:</strong> ${formData.reportingTo}</li>
    </ul>

    <div class="page-break"></div>

    <div class="heading">Internship Benefits</div>
    <div class="body-text">As part of the Trimax Connect Internship Program, you will receive:</div>
    <ul>
        <li>Industry-Recognized Internship Certificate upon successful completion</li>
        <li>Hands-on Practical Training on live industry projects</li>
        <li>Career-Oriented Learning with real-world exposure</li>
        <li>Guidance & Mentorship by Industry Experts</li>
        <li>Opportunity to work in a professional MNC-style environment</li>
    </ul>

    <div class="heading">Salary & Compensation Structure</div>
    <div class="body-text">
        This internship is performance-based.<br/><br/>
        • For the initial 6 months, the internship is non-paid, focusing on training, skill development, and live project exposure.<br/>
        • After successful completion of the internship period and based on performance evaluation, interns may be considered for stipend-based or paid roles.
    </div>

    <div class="heading">Post-Internship Salary Structure (Performance-Based):</div>
    <div class="body-text">
        • <strong>Stipend / Salary Range:</strong> ${formData.salaryRange} per month<br/>
        • Salary will be decided based on: Work quality & consistency
    </div>
    <ul>
        <li>Technical skills</li>
        <li>Attendance & discipline</li>
        <li>Contribution to live projects</li>
        <li>Exceptional performers may also receive:</li>
        <li>Performance-based bonus / gift incentives</li>
        <li>Opportunity for full-time employment</li>
    </ul>

    <div class="heading">Client Gift & Feedback Policy</div>
    <div class="body-text">
        Any gift or monetary amount offered by clients as appreciation or feedback for work done must be declared and submitted to the company.<br/>
        Employees are not permitted to accept personal gifts or cash from clients in connection with official work without prior management approval.
    </div>

    <div class="page-break"></div>

    <div class="heading">Company Policies & Working Time Rules</div>

    <div class="heading">1. Working Hours</div>
    <ul>
        <li>Official working hours are 10:00 AM to 6:30 PM, Monday to Friday.</li>
        <li>Sunday is a weekly off, unless work is assigned due to business requirements.</li>
        <li>Employees are expected to be punctual and regular. Late arrivals or early departures without approval may be noted.</li>
    </ul>

    <div class="heading">2. Attendance Policy</div>
    <ul>
        <li>Daily attendance must be marked as per company guidelines (biometric/system/manual).</li>
        <li>Continuous absenteeism or irregular attendance may lead to disciplinary action.</li>
        <li>Leave without prior approval will be treated as unauthorized absence.</li>
    </ul>

    <div class="heading">3. Leave Policy</div>
    <ul>
        <li>Leaves are subject to prior approval from the reporting manager/HR.</li>
        <li>Emergency leave must be informed at the earliest possible time.</li>
        <li>Unused leaves are non-carry forward and non-encashable, unless otherwise stated.</li>
    </ul>

    <div class="heading">4. Performance & Target Policy</div>
    <ul>
        <li>This role is not target-driven and focuses on quality work, customer engagement, and long-term relationship building.</li>
        <li>Employees are not assigned mandatory sales targets, ensuring a stress-free and supportive work environment.</li>
        <li>Salary is fixed and paid monthly, irrespective of sales numbers, and performance is reviewed based on effort, communication quality, and professionalism, not pressure-based outcomes.</li>
    </ul>

    <div class="heading">5. Salary & Incentive Rules</div>
    <ul>
        <li>Monthly salary will be credited between the 1st to 10th of every month.</li>
        <li>Incentives are paid based on verified and confirmed enrollments.</li>
        <li>Any false, duplicate, or cancelled enrollment will not be eligible for incentive payout.</li>
    </ul>

    <div class="heading">6. Professional Conduct</div>
    <ul>
        <li>Employees must maintain professional behavior with clients, students, and colleagues.</li>
        <li>Misconduct, misrepresentation, or unethical practices will result in strict action, including termination.</li>
    </ul>

    <div class="page-break"></div>

    <div class="heading">7. Confidentiality Policy</div>
    <ul>
        <li>All company data, leads, documents, and internal information are strictly confidential.</li>
        <li>Sharing company information with third parties without authorization is prohibited.</li>
    </ul>

    <div class="heading">8. Reporting & Communication</div>
    <ul>
        <li>Daily work updates and reports must be shared as instructed by the reporting manager.</li>
        <li>Participation in daily meetings and reviews is mandatory.</li>
    </ul>

    <div class="heading">9. Probation & Continuation</div>
    <ul>
        <li>Employment is subject to performance during the initial period.</li>
        <li>The company reserves the right to discontinue employment if performance or conduct is unsatisfactory.</li>
    </ul>

    <div class="heading">10. Termination Policy</div>
    <ul>
        <li>Either party may terminate employment by giving prior notice as per company norms.</li>
        <li>The company reserves the right to terminate employment immediately in case of serious misconduct or policy violation.</li>
    </ul>

    <div class="heading">11. Code of Ethics & Integrity</div>
    <ul>
        <li>Developers must work with honesty, transparency, and professionalism.</li>
        <li>Misrepresentation of work, misuse of data, or acceptance of personal benefits is strictly prohibited.</li>
    </ul>

    <div class="heading">12. Performance Review Policy</div>
    <ul>
        <li>Performance is evaluated based on work quality, deadlines, and teamwork.</li>
        <li>There are no sales or enrollment targets for developer roles.</li>
        <li>Management may review or revise responsibilities as required.</li>
    </ul>

    <div class="heading">13. Incentive & Recognition Policy</div>
    <ul>
        <li>Incentives, if applicable, are based on technical performance and project contributions.</li>
        <li>All incentives are subject to management approval.</li>
    </ul>

    <div class="heading">14. Data Protection & CRM Usage</div>
    <ul>
        <li>All leads, student data, and internal records must be updated only in the authorized CRM/system.</li>
        <li>Downloading, copying, or sharing data externally is strictly prohibited.</li>
        <li>Data misuse will result in immediate termination and legal action.</li>
    </ul>

    <div class="heading">15. IT & Digital Asset Usage</div>
    <ul>
        <li>Company-provided email, systems, and tools must be used only for official purposes.</li>
        <li>Sharing login credentials is strictly prohibited.</li>
        <li>Unauthorized software installation or data storage is not permitted.</li>
    </ul>

    <div class="signature-section">
        <div class="signature-box">
            <strong>For Trimax Connect Software Limited</strong><br/>
            Authorized Signatory<br/><br/><br/>
            <em>Digital Signature</em>
        </div>
        <div class="signature-box">
            <strong>Accepted & Signed by:</strong><br/>
            ${formData.candidateName}<br/>
            ${formData.candidatePhone}<br/>
            ${formData.candidateEmail}<br/><br/>
            (Signature & Date)
        </div>
    </div>

    <div class="footer">
        <strong>📞 Contact Us</strong><br/>
        Trimax Connect Software Limited<br/>
        📱 +91 8588942008 | 🌐 www.trimaxconnect.com | 📧 info@trimaxconnect.com
    </div>
</body>
</html>
`;

      // Create HTML file
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      // Create a temporary link to download
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName.replace('.pdf', '.html');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      alert(`✅ Offer Letter Generated Successfully!

File: ${fileName.replace('.pdf', '.html')}

Note: HTML file has been downloaded. You can:
1. Open it in a browser
2. Print to PDF (Ctrl+P → Save as PDF)

The file contains the complete offer letter with all policies.`);
      
      // Reset form
      setFormData({
        candidateName: '',
        candidateEmail: '',
        candidatePhone: '',
        position: 'Full Stack Web Developer Intern',
        joiningDate: '',
        duration: '6 Months',
        workMode: 'Work from Home / Hybrid',
        department: 'IT Development',
        reportingTo: 'HR Department / Project Manager',
        salaryRange: '₹10,000 – ₹25,000'
      });
      
    } catch (error) {
      console.error('Error:', error);
      alert(`❌ Error generating offer letter!

${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-5">
          <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-[20px] bg-gradient-to-br from-brand-600 to-blue-600 flex items-center justify-center text-white shadow-xl shadow-brand-500/20 overflow-hidden group shrink-0">
            <div className="absolute inset-0 bg-white/20 blur-md rounded-full -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <Layers size={30} strokeWidth={2.5} className="relative z-10 drop-shadow-md group-hover:scale-110 transition-transform duration-300" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-[34px] font-black font-display text-transparent bg-clip-text bg-gradient-to-r from-slate-700 via-brand-800 to-brand-600 tracking-tight leading-tight pb-1 mb-0.5">
              Generate Offer Letter
            </h1>
            <p className="text-[14px] sm:text-[15px] font-medium text-slate-500">
              Create professional offer letters for candidates
            </p>
          </div>
        </div>
        <div className="p-3 bg-blue-100 rounded-lg">
          <FileText className="text-blue-600" size={32} />
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
          <User size={20} className="text-blue-600" />
          Candidate Information
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Candidate Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Candidate Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="candidateName"
              value={formData.candidateName}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter full name"
              required
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="candidateEmail"
              value={formData.candidateEmail}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="candidate@example.com"
              required
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              name="candidatePhone"
              value={formData.candidatePhone}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="+91 XXXXXXXXXX"
            />
          </div>

          {/* Position */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Position</label>
            <input
              type="text"
              name="position"
              value={formData.position}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Joining Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date of Joining <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="joiningDate"
              value={formData.joiningDate}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
            <select
              name="duration"
              value={formData.duration}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option>3 Months</option>
              <option>6 Months</option>
              <option>12 Months</option>
            </select>
          </div>

          {/* Work Mode */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Work Mode</label>
            <select
              name="workMode"
              value={formData.workMode}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option>Work from Home / Hybrid</option>
              <option>Work from Office</option>
              <option>Work from Home</option>
            </select>
          </div>

          {/* Department */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
            <input
              type="text"
              name="department"
              value={formData.department}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Reporting To */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Reporting Authority</label>
            <input
              type="text"
              name="reportingTo"
              value={formData.reportingTo}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Salary Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Post-Internship Salary Range</label>
            <input
              type="text"
              name="salaryRange"
              value={formData.salaryRange}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Generate Button */}
        <div className="mt-8 flex gap-4">
          <button
            onClick={handleGeneratePDF}
            disabled={isGenerating}
            className={`px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium ${
              isGenerating ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Generating...
              </>
            ) : (
              <>
                <FileText size={20} />
                Generate Offer Letter
              </>
            )}
          </button>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
        <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
          <AlertCircle size={20} />
          Information
        </h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• The offer letter will be generated as an HTML file</li>
          <li>• Open the HTML file in browser and Print to PDF (Ctrl+P)</li>
          <li>• All 15 company policies are included</li>
          <li>• Professional formatting matching Trimax Connect template</li>
        </ul>
      </div>

      {/* Preview Card */}
      <div className="bg-gradient-to-r from-brand-50 to-blue-50 border border-purple-200 rounded-2xl p-6">
        <h3 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
          <Briefcase size={20} />
          Offer Letter Preview
        </h3>
        <div className="bg-white rounded-lg p-4 space-y-2 text-sm">
          <p><strong>Candidate:</strong> {formData.candidateName || '---'}</p>
          <p><strong>Email:</strong> {formData.candidateEmail || '---'}</p>
          <p><strong>Position:</strong> {formData.position}</p>
          <p><strong>Joining Date:</strong> {formData.joiningDate ? new Date(formData.joiningDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) : '---'}</p>
          <p><strong>Duration:</strong> {formData.duration}</p>
          <p><strong>Work Mode:</strong> {formData.workMode}</p>
        </div>
      </div>
    </div>
  );
};

export default GenerateOfferLetter;