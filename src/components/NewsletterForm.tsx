import React from 'react';
import { FormSection } from './FormSection';
import { FormField } from './FormField';
import { Toggle } from './Toggle';
import { useFormState } from '../hooks/useFormState';
import { Star, Sparkles } from 'lucide-react';

export const NewsletterForm: React.FC = () => {
  const { formData, updateField, updatePractice, updateLifeFocus } = useFormState();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    // Handle form submission
  };

  const lifeFocusCount = Object.values(formData.lifeFocus).filter(Boolean).length;

  return (
    <div className="max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-12">
        {/* Personal Information */}
        <FormSection title="Personal Information">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              label="Full Name"
              tooltip="Your complete legal name. Required for numerology readings."
              required={formData.practices.numerology}
            >
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => updateField('fullName', e.target.value)}
                className="w-full px-4 py-3 bg-transparent border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                placeholder="Enter your full name"
              />
            </FormField>

            <FormField
              label="Preferred Name"
              tooltip="How you'd like to be addressed in your daily newsletter."
              required
            >
              <input
                type="text"
                value={formData.preferredName}
                onChange={(e) => updateField('preferredName', e.target.value)}
                className="w-full px-4 py-3 bg-transparent border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                placeholder="What should we call you?"
                required
              />
            </FormField>
          </div>

          <FormField
            label="Email"
            tooltip="Your email address where we'll send your personalized daily cosmic insights."
            required
          >
            <input
              type="email"
              value={formData.email}
              onChange={(e) => updateField('email', e.target.value)}
              className="w-full px-4 py-3 bg-transparent border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              placeholder="your@email.com"
              required
            />
          </FormField>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              label="Birth Date"
              tooltip="Your date of birth for accurate astrological and numerological readings."
              required
            >
              <input
                type="date"
                value={formData.birthDate}
                onChange={(e) => updateField('birthDate', e.target.value)}
                className="w-full px-4 py-3 bg-transparent border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                required
              />
            </FormField>

            <FormField
              label="Birth Time"
              tooltip="Your time of birth for precise astrological chart calculations. Select 'Unknown' if uncertain."
            >
              <div className="flex space-x-2">
                <input
                  type="time"
                  value={formData.birthTime}
                  onChange={(e) => updateField('birthTime', e.target.value)}
                  className="flex-1 px-4 py-3 bg-transparent border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => updateField('birthTime', 'unknown')}
                  className="px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm"
                >
                  Unknown
                </button>
              </div>
            </FormField>
          </div>

          <FormField
            label="Birth Location"
            tooltip="City and country where you were born for location-based astrological calculations."
            required
          >
            <input
              type="text"
              value={formData.birthLocation}
              onChange={(e) => updateField('birthLocation', e.target.value)}
              className="w-full px-4 py-3 bg-transparent border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              placeholder="City, Country"
              required
            />
          </FormField>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              label="Time Zone"
              tooltip="Your current time zone for delivering content at the perfect moment."
            >
              <select
                value={formData.timeZone}
                onChange={(e) => updateField('timeZone', e.target.value)}
                className="w-full px-4 py-3 bg-transparent border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors appearance-none [color-scheme:dark]"
              >
                <option value={Intl.DateTimeFormat().resolvedOptions().timeZone} className="bg-gray-800">
                  {Intl.DateTimeFormat().resolvedOptions().timeZone} (Auto-detected)
                </option>
                <option value="America/New_York" className="bg-gray-800">Eastern Time</option>
                <option value="America/Chicago" className="bg-gray-800">Central Time</option>
                <option value="America/Denver" className="bg-gray-800">Mountain Time</option>
                <option value="America/Los_Angeles" className="bg-gray-800">Pacific Time</option>
                <option value="Europe/London" className="bg-gray-800">GMT</option>
                <option value="Europe/Paris" className="bg-gray-800">CET</option>
                <option value="Asia/Tokyo" className="bg-gray-800">JST</option>
              </select>
            </FormField>

            <FormField
              label="Day Start Time"
              tooltip="When does your day typically begin? We'll tailor your content for the perfect morning energy."
            >
              <input
                type="time"
                value={formData.dayStartTime}
                onChange={(e) => updateField('dayStartTime', e.target.value)}
                className="w-full px-4 py-3 bg-transparent border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              />
            </FormField>
          </div>

          <FormField
            label="Relationship Status"
            tooltip="Optional information to personalize relationship and love-focused content."
          >
            <select
              value={formData.relationshipStatus}
              onChange={(e) => updateField('relationshipStatus', e.target.value)}
              className="w-full px-4 py-3 bg-transparent border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors appearance-none [color-scheme:dark]"
            >
              <option value="" className="bg-gray-800">Prefer not to say</option>
              <option value="single" className="bg-gray-800">Single</option>
              <option value="dating" className="bg-gray-800">Dating</option>
              <option value="relationship" className="bg-gray-800">In a Relationship</option>
              <option value="married" className="bg-gray-800">Married</option>
              <option value="complicated" className="bg-gray-800">It's Complicated</option>
              <option value="looking" className="bg-gray-800">Looking for Love</option>
            </select>
          </FormField>
        </FormSection>

        {/* Practice Selection */}
        <FormSection title="Cosmic Practices">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Toggle
              id="astrology"
              checked={formData.practices.astrology}
              onChange={(checked) => updatePractice('astrology', checked)}
              label="Astrology"
            />
            <Toggle
              id="numerology"
              checked={formData.practices.numerology}
              onChange={(checked) => updatePractice('numerology', checked)}
              label="Numerology"
            />
            <Toggle
              id="tarot"
              checked={formData.practices.tarot}
              onChange={(checked) => updatePractice('tarot', checked)}
              label="Daily Tarot Wisdom"
            />
            <Toggle
              id="crystals"
              checked={formData.practices.crystals}
              onChange={(checked) => updatePractice('crystals', checked)}
              label="Crystal & Gemstone Guidance"
            />
            <Toggle
              id="chakra"
              checked={formData.practices.chakra}
              onChange={(checked) => updatePractice('chakra', checked)}
              label="Chakra & Energy Work"
            />
            <Toggle
              id="fengshui"
              checked={formData.practices.fengShui}
              onChange={(checked) => updatePractice('fengShui', checked)}
              label="Feng Shui & Space Harmony"
            />
          </div>
        </FormSection>

        {/* Life Focus Areas */}
        <FormSection title={`Life Focus Areas (${lifeFocusCount}/3 selected)`}>
          <p className="text-gray-400 text-sm mb-4">
            Choose up to 3 areas where you'd like focused cosmic guidance
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Toggle
              id="love"
              checked={formData.lifeFocus.love}
              onChange={(checked) => updateLifeFocus('love', checked)}
              label="Love & Relationships"
              disabled={!formData.lifeFocus.love && lifeFocusCount >= 3}
            />
            <Toggle
              id="career"
              checked={formData.lifeFocus.career}
              onChange={(checked) => updateLifeFocus('career', checked)}
              label="Career & Success"
              disabled={!formData.lifeFocus.career && lifeFocusCount >= 3}
            />
            <Toggle
              id="health"
              checked={formData.lifeFocus.health}
              onChange={(checked) => updateLifeFocus('health', checked)}
              label="Health & Wellness"
              disabled={!formData.lifeFocus.health && lifeFocusCount >= 3}
            />
            <Toggle
              id="wealth"
              checked={formData.lifeFocus.wealth}
              onChange={(checked) => updateLifeFocus('wealth', checked)}
              label="Wealth & Abundance"
              disabled={!formData.lifeFocus.wealth && lifeFocusCount >= 3}
            />
            <Toggle
              id="growth"
              checked={formData.lifeFocus.growth}
              onChange={(checked) => updateLifeFocus('growth', checked)}
              label="Personal Growth"
              disabled={!formData.lifeFocus.growth && lifeFocusCount >= 3}
            />
            <Toggle
              id="family"
              checked={formData.lifeFocus.family}
              onChange={(checked) => updateLifeFocus('family', checked)}
              label="Family & Home"
              disabled={!formData.lifeFocus.family && lifeFocusCount >= 3}
            />
          </div>
        </FormSection>

        {/* Submit Button */}
        <div className="flex justify-center pt-8">
          <button
            type="submit"
            className="group relative px-12 py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 text-white font-semibold rounded-full hover:from-blue-500 hover:via-purple-500 hover:to-blue-600 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            <div className="flex items-center space-x-2">
              <Star className="w-5 h-5" />
              <span>Begin My Cosmic Journey</span>
              <Sparkles className="w-5 h-5" />
            </div>
          </button>
        </div>
      </form>
    </div>
  );
};