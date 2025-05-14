class AddMinorLeagueId < ActiveRecord::Migration[5.0]
  def change
    add_column :players, :bbref_minors, :string
  end
end
