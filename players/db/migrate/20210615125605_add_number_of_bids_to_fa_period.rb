class AddNumberOfBidsToFaPeriod < ActiveRecord::Migration[6.1]
  def change
    add_column :free_agency_periods, :max_bids_for_team, :integer, default: 7
    add_column :free_agency_periods, :max_contract_length, :integer, default: 5
  end
end
