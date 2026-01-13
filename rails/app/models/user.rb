class User < ApplicationRecord
  # Include default devise modules. Others available are:
  # :confirmable, :lockable, :timeoutable and :omniauthable
  devise :database_authenticatable,
         :recoverable,
         :rememberable,
         :trackable,
         :validatable,
         :jwt_authenticatable, jwt_revocation_strategy: JwtDenylist

  # Use username for authentication instead of email
  belongs_to :team, optional: true

  validates :username,
    presence: true,
    uniqueness: { case_sensitive: false },
    format: { with: /\A[a-zA-Z0-9_\.]+\z/, message: "can only contain letters, numbers, underscores and periods" },
    length: { minimum: 3, maximum: 50 }

  # Override Devise method to find user by username instead of email
  def self.find_for_database_authentication(warden_conditions)
    conditions = warden_conditions.dup
    if (username = conditions.delete(:username))
      where(conditions.to_h).where(["lower(username) = :value", { value: username.downcase }]).first
    elsif conditions.has_key?(:username)
      where(conditions.to_h).first
    end
  end

  # Alias username as email for Devise compatibility
  # Devise's :recoverable module expects an email method
  def email
    username
  end

  def email=(value)
    self.username = value
  end

  # Disable email validation from Devise
  def email_required?
    false
  end

  def email_changed?
    false
  end

  def will_save_change_to_email?
    false
  end

  def owns_team?(team)
    self.team_id == team&.id
  end

  def jwt_payload
    {'adm' => self.is_admin?.to_s, 'tm' => self.team&.id }
  end
end
