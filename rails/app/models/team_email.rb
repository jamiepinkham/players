class TeamEmail < ApplicationRecord
  belongs_to :team

  validates :email,
    presence: true,
    format: { with: URI::MailTo::EMAIL_REGEXP, message: "must be a valid email address" },
    uniqueness: { scope: :team_id, case_sensitive: false }

  validates :primary, uniqueness: { scope: :team_id, message: "can only have one primary email per team" }, if: :primary?

  scope :primary, -> { where(primary: true) }
  scope :for_trade_notifications, -> { where(receive_trade_notifications: true) }

  before_validation :downcase_email

  def to_s
    email
  end

  def rails_admin_label
    to_s
  end

  def custom_label
    to_s
  end

  private

  def downcase_email
    self.email = email.downcase if email.present?
  end
end
