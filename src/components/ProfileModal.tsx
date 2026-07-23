import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  X,
  User,
  GraduationCap,
  Briefcase,
  MapPin,
  Target,
  Sparkles,
  CheckCircle2,
  Plus,
  Trash2,
  AlertCircle,
} from 'lucide-react';

export const ProfileModal: React.FC = () => {
  const { isProfileModalOpen, setIsProfileModalOpen, userProfile, updateUserProfile } = useApp();

  const [formData, setFormData] = useState({
    name: userProfile.name || '',
    education: userProfile.education || '',
    preferredRole: userProfile.preferredRole || '',
    location: userProfile.location || '',
    state: userProfile.state || '',
    careerGoals: userProfile.careerGoals || '',
    age: userProfile.age !== undefined && userProfile.age !== null ? (userProfile.age as number | string) : '',
    gender: userProfile.gender || '',
    incomeBracket: userProfile.incomeBracket || '',
    occupation: userProfile.occupation || '',
  });

  const [skillsList, setSkillsList] = useState<string[]>(userProfile.skills || []);
  const [newSkillInput, setNewSkillInput] = useState<string>('');

  const [interestsList, setInterestsList] = useState<string[]>(userProfile.interests || []);
  const [newInterestInput, setNewInterestInput] = useState<string>('');

  useEffect(() => {
    if (isProfileModalOpen) {
      setFormData({
        name: userProfile.name || '',
        education: userProfile.education || '',
        preferredRole: userProfile.preferredRole || '',
        location: userProfile.location || '',
        state: userProfile.state || '',
        careerGoals: userProfile.careerGoals || '',
        age: userProfile.age !== undefined && userProfile.age !== null ? (userProfile.age as number | string) : '',
        gender: userProfile.gender || '',
        incomeBracket: userProfile.incomeBracket || '',
        occupation: userProfile.occupation || '',
      });
      setSkillsList(userProfile.skills || []);
      setInterestsList(userProfile.interests || []);
    }
  }, [userProfile, isProfileModalOpen]);

  if (!isProfileModalOpen) return null;

  const handleAddSkill = () => {
    if (newSkillInput.trim() && !skillsList.includes(newSkillInput.trim())) {
      setSkillsList([...skillsList, newSkillInput.trim()]);
      setNewSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkillsList(skillsList.filter((s) => s !== skillToRemove));
  };

  const handleAddInterest = () => {
    if (newInterestInput.trim() && !interestsList.includes(newInterestInput.trim())) {
      setInterestsList([...interestsList, newInterestInput.trim()]);
      setNewInterestInput('');
    }
  };

  const handleRemoveInterest = (itemToRemove: string) => {
    setInterestsList(interestsList.filter((i) => i !== itemToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile({
      ...formData,
      age: formData.age !== '' ? Number(formData.age) : undefined,
      skills: skillsList,
      interests: interestsList,
    });
    setIsProfileModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full my-8 max-h-[90vh] flex flex-col text-slate-800 dark:text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Candidate Profile</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Manually enter or update your details for AI recommendations</p>
            </div>
          </div>
          <button
            onClick={() => setIsProfileModalOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Form Fields Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                placeholder="Candidate Full Name"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Education / Degree</label>
              <input
                type="text"
                value={formData.education}
                onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                placeholder="Degree / University"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Target / Preferred Role</label>
              <input
                type="text"
                value={formData.preferredRole}
                onChange={(e) => setFormData({ ...formData, preferredRole: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                placeholder="e.g. Software Engineer"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">City / Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                placeholder="e.g. City, Country"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">State / Region</label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                placeholder="State or Region"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Age & Occupation</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  placeholder="Age (Optional)"
                />
                <input
                  type="text"
                  value={formData.occupation}
                  onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  placeholder="Student / Professional"
                />
              </div>
            </div>
          </div>

          {/* Income & Category Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Annual Family Income Bracket</label>
              <select
                value={formData.incomeBracket}
                onChange={(e) => setFormData({ ...formData, incomeBracket: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="">Select Income Bracket (Optional)</option>
                <option value="Below ₹2.5 Lakhs">Below ₹2.5 Lakhs (EWS / BPL)</option>
                <option value="₹2.5 Lakhs - ₹5 Lakhs">₹2.5 Lakhs - ₹5 Lakhs</option>
                <option value="₹5 Lakhs - ₹8 Lakhs">₹5 Lakhs - ₹8 Lakhs</option>
                <option value="Above ₹8 Lakhs">Above ₹8 Lakhs</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Gender</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="">Select Gender (Optional)</option>
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Other / Prefer not to say">Other / Prefer not to say</option>
              </select>
            </div>
          </div>

          {/* Career Goals */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Long-term Career Goals</label>
            <textarea
              rows={2}
              value={formData.careerGoals}
              onChange={(e) => setFormData({ ...formData, careerGoals: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              placeholder="Career goals or summary..."
            ></textarea>
          </div>

          {/* Skills Management */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Technical & Professional Skills</label>
            <div className="flex items-center space-x-2 mb-2">
              <input
                type="text"
                value={newSkillInput}
                onChange={(e) => setNewSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSkill();
                  }
                }}
                placeholder="Add skill (e.g. React, Python, Cloud)..."
                className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={handleAddSkill}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-semibold flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1">
              {skillsList.map((skill) => (
                <span
                  key={skill}
                  className="px-2.5 py-1 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-medium flex items-center space-x-1"
                >
                  <span>{skill}</span>
                  <button type="button" onClick={() => handleRemoveSkill(skill)} className="hover:text-red-500">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={() => setIsProfileModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-600/20"
            >
              Save Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
