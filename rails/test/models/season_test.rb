require 'test_helper'

class SeasonTest < ActiveSupport::TestCase
  test "count_seasons_to returns 1 for same season" do
    season = create(:season)
    assert_equal 1, season.count_seasons_to(season)
  end

  test "count_seasons_to returns correct count for multiple seasons" do
    season1 = create(:season)
    season2 = create(:season, previous_season: season1)
    season3 = create(:season, previous_season: season2)

    assert_equal 3, season1.count_seasons_to(season3)
    assert_equal 2, season2.count_seasons_to(season3)
    assert_equal 1, season3.count_seasons_to(season3)
  end

  test "count_seasons_to returns 0 for nil end_season" do
    season = create(:season)
    assert_equal 0, season.count_seasons_to(nil)
  end
end
