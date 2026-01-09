class CreateTeamEmails < ActiveRecord::Migration[6.1]
  def change
    create_table :team_emails do |t|
      t.references :team, null: false, foreign_key: true
      t.string :email, null: false
      t.boolean :primary, default: false, null: false
      t.boolean :receive_trade_notifications, default: true, null: false

      t.timestamps
    end

    add_index :team_emails, [:team_id, :email], unique: true
  end
end
