class AddAuditColumnsToBids < ActiveRecord::Migration[5.0]
  def change
    add_column :bids, :is_active, :boolean, null: false, default: true
    add_column :bids, :is_leading, :boolean, null: false, default: false
    add_column :bids, :contract_id, :integer
  end
end
