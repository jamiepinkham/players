class FixJwtList < ActiveRecord::Migration[5.0]
  def change
    remove_column :jwt_denylist, :expired_at
    add_column :jwt_denylist, :exp, :datetime, null: false
  end
end
