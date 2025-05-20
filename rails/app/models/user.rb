class User < ApplicationRecord
  # Include default devise modules. Others available are:
  # :confirmable, :lockable, :timeoutable and :omniauthable
  devise :database_authenticatable, 
         :recoverable, 
         :rememberable, 
         :trackable, 
         :validatable,
         :jwt_authenticatable, jwt_revocation_strategy: JwtDenylist

  has_and_belongs_to_many :teams

  def team
    self.teams.first
  end

  def owns_team?(team)
    self.teams.include?(team)
  end

  def jwt_payload
    {'adm' => self.is_admin?.to_s, 'tm' => self.team.id }
  end
end
