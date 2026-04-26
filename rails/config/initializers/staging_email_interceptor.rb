# frozen_string_literal: true

# Standard Rails email interceptor for staging/QA environments
# Logs email details instead of actually sending them
if Rails.env.staging?
  class StagingEmailInterceptor
    def self.delivering_email(message)
      Rails.logger.info "="*80
      Rails.logger.info "📧 EMAIL INTERCEPTED (Staging - Not Sent)"
      Rails.logger.info "="*80
      Rails.logger.info "From: #{message.from&.join(', ')}"
      Rails.logger.info "To: #{message.to&.join(', ')}"
      Rails.logger.info "Cc: #{message.cc&.join(', ')}" if message.cc.present?
      Rails.logger.info "Bcc: #{message.bcc&.join(', ')}" if message.bcc.present?
      Rails.logger.info "Subject: #{message.subject}"
      Rails.logger.info "-"*80

      # Log body preview
      if message.multipart?
        Rails.logger.info "Body (text): #{message.text_part&.body&.to_s&.truncate(500)}"
        Rails.logger.info "Body (html): #{message.html_part&.body&.to_s&.truncate(500)}"
      else
        Rails.logger.info "Body: #{message.body.to_s.truncate(500)}"
      end

      Rails.logger.info "="*80

      # Prevent actual delivery
      message.perform_deliveries = false
    end
  end

  ActionMailer::Base.register_interceptor(StagingEmailInterceptor)
  Rails.logger.info "📧 Staging email interceptor registered - emails will be logged, not sent"
end
